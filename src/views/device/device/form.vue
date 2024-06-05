<!--
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
-->
<template>
  <BasicDrawer
    v-bind="$attrs"
    :showFooter="true"
    :okAuth="'device:device:edit'"
    @register="registerDrawer"
    @ok="handleSubmit"
    width="60%"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="m-1 pr-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
    <a-button @click="handleOpenLed(record)">
      {{ t('开灯') }}
    </a-button>
    <a-button @click="handleCloseLed(record)">
      {{ t('关灯') }}
    </a-button>
    <a-descriptions title="设备实时信息" bordered>
      <a-descriptions-item label="设备名">{{ record.deviceName }}</a-descriptions-item>
      <a-descriptions-item label="设备ID">{{ record.deviceId }}</a-descriptions-item>
      <a-descriptions-item label="设备状态" :span="3">
        <a-badge :status="badgeStatus.value" :text="badgeStatus.label" />
      </a-descriptions-item>
      <a-descriptions-item label="光照强度(lux)">{{ ledData.lux }}</a-descriptions-item>
      <a-descriptions-item label="温度">{{ ledData.temprature }}</a-descriptions-item>
    </a-descriptions>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsDeviceDeviceForm">
  import { ref, unref, computed, onMounted, onBeforeMount, watch } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicDrawer, useDrawer, useDrawerInner } from '/@/components/Drawer';
  import {
    Device,
    deviceSave,
    deviceForm,
    deviceTreeData,
    deviceOpenLight,
    deviceCloseLight,
    queryDeviceData,
    subscribeTopic,
  } from '/@/api/device/device';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('device.device');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<Device>({} as Device);

  const getTitle = computed(() => ({
    icon: meta.icon || 'i-ant-design:book-outlined',
    value: record.value.isNewRecord
      ? t('新增device : 存储设备层次的根表')
      : t('编辑device : 存储设备层次的根表'),
  }));

  const isTimerActive = ref(false);

  watch(isTimerActive, (newVal) => {
    if (newVal) {
      startTimer();
    } else {
      stopTimer();
    }
  });

  function startTimer() {
    if (!intervalId) {
      intervalId = window.setInterval(() => {
        handleLedDataQuery();
      }, 5000);
    }
  }

  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('close timer');
      intervalId = null;
    }
  }

  let intervalId = null;

  const ledData = ref({
    lux: '',
    temprature: '',
  });

  const badgeStatus = ref({
    value: 'default',
    label: '不在运行',
  });

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('上级device : 存储设备层次的根表'),
      field: 'parentCode',
      fieldLabel: 'parentName',
      component: 'TreeSelect',
      componentProps: {
        allowClear: true,
        style: 'width: calc(50% - 60px)',
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('排序号'),
      field: 'treeSort',
      helpMessage: '升序',
      component: 'InputNumber',
      defaultValue: '30',
      componentProps: {
        maxlength: 8,
      },
      rules: [{ required: true }, { pattern: /^\d+$/, message: t('请输入一个正整数') }],
    },
    {
      label: t('device_name '),
      field: 'deviceName',
      component: 'Input',
      componentProps: {
        maxlength: 255,
      },
      required: true,
    },
    {
      label: t('device_status : 设备状态'),
      field: 'deviceStatus',
      component: 'Input',
      componentProps: {
        maxlength: 2,
      },
      rules: [{ pattern: /^\d+$/, message: t('请输入一个正整数') }],
    },
    {
      label: t('img '),
      field: 'img',
      component: 'Input',
      componentProps: {
        maxlength: 255,
      },
    },
    {
      label: t('图片上传'),
      field: 'dataMap',
      component: 'Upload',
      componentProps: {
        loadTime: computed(() => record.value.__t),
        bizKey: computed(() => record.value.id),
        bizType: 'device_image',
        uploadType: 'image',
      },
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('附件上传'),
      field: 'dataMap',
      component: 'Upload',
      componentProps: {
        loadTime: computed(() => record.value.__t),
        bizKey: computed(() => record.value.id),
        bizType: 'device_file',
        uploadType: 'all',
      },
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    setDrawerProps({ loading: true });
    await resetFields();
    const res = await deviceForm(data);
    record.value = (res.device || {}) as Device;
    record.value.__t = new Date().getTime();
    if (data.parentCode && data.parentName) {
      record.value.parentCode = data.parentCode;
      record.value.parentName = data.parentName;
    }
    setFieldsValue(record.value);
    updateSchema([
      {
        field: 'parentCode',
        componentProps: {
          api: deviceTreeData,
          params: {
            excludeCode: record.value.id,
            isShowRawName: true,
          },
        },
      },
    ]);
    setDrawerProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setDrawerProps({ confirmLoading: true });
      const params: any = {
        isNewRecord: record.value.isNewRecord,
        deviceId: record.value.deviceId,
      };
      data.oldParentCode = record.value.parentCode;
      // console.log('submit', params, data, record);
      const res = await deviceSave(params, data);
      showMessage(res.message);
      setTimeout(closeDrawer);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ confirmLoading: false });
    }
  }

  async function handleLedDataQuery() {
    if (record.value.deviceName != undefined) {
      queryDeviceData({ topic: record.value.deviceName + '/get' })
        .then((data) => {
          console.log('data: ', data);
          if (data === undefined || data === null || data === '') {
            badgeStatus.value.value = 'error';
            badgeStatus.value.label = '设备出错';
          } else {
            ledData.value.lux = data.lux;
            ledData.value.temprature = data.temprature;
            badgeStatus.value.value = 'processing';
            badgeStatus.value.label = '正在运行';
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  async function handleOpenLed(record: Recordable) {
    deviceOpenLight({
      deviceid: record.deviceid,
      devicename: record.devicename,
      devicestatus: record.devicestatus,
      img: record.img,
      ledcmd: 1,
      topic: record.devicename + '/get',
    }).then((data) => {
      isTimerActive.value = true;
      badgeStatus.value.value = 'processing';
      badgeStatus.value.label = '正在运行';
      handleSubscribe(record);
      console.log('openLed: ', data);
    });
  }

  async function handleCloseLed(record: Recordable) {
    deviceCloseLight({
      deviceId: record.deviceId,
      deviceName: record.deviceName,
      deviceStatus: record.deviceStatus,
      img: record.img,
      ledcmd: 0,
      topic: record.deviceName + '/get',
    }).then((data) => {
      isTimerActive.value = false;
      badgeStatus.value.value = 'default';
      badgeStatus.value.label = '不在运行';
      ledData.value.lux = '';
      ledData.value.temprature = '';
      console.log('closeLed: ', data);
    });
  }
  async function handleSubscribe(record: Recordable) {
    const params = { topic: record.deviceName + '/get' };
    const res = await subscribeTopic(params);
    showMessage(res.message);
  }
</script>
