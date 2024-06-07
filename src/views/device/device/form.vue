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
    <a-button @click="enableDevice(record)">
      {{ t('开启设备') }}
    </a-button>
    <a-button @click="disableDevice(record)">
      {{ t('关闭设备') }}
    </a-button>
    <a-descriptions title="设备实时信息" bordered>
      <a-descriptions-item label="设备名">{{ record.deviceName }}</a-descriptions-item>
      <a-descriptions-item label="设备ID">{{ record.deviceId }}</a-descriptions-item>
      <a-descriptions-item label="设备状态" :span="3">
        <a-badge :status="badgeStatus.value" :text="badgeStatus.label" />
      </a-descriptions-item>
      <a-descriptions-item label="光照强度(lux)">{{ deviceData.lux }}</a-descriptions-item>
      <a-descriptions-item label="温度">{{ deviceData.temprature }}</a-descriptions-item>
      <a-descriptions-item label="风扇"
        >{{ fanData.status }}

        <a-button @click="handleFanOpen(record)">
          {{ t('开风扇') }}
        </a-button>
        <a-button @click="handleFanClose(record)">
          {{ t('关风扇') }}
        </a-button>
      </a-descriptions-item>
      <a-descriptions-item label="led"
        >{{ ledStatus.status }}

        <a-button @click="handleOpenLed(record)">
          {{ t('开灯') }}
        </a-button>
        <a-button @click="handleCloseLed(record)">
          {{ t('关灯') }}
        </a-button>
      </a-descriptions-item>
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
    deviceOpenFan,
    deviceCloseFan,
    deviceEnable,
    deviceDisable,
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
      console.log('start timer: ', intervalId);
    }
  }

  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('close timer id: ', intervalId);
      intervalId = null;
    }
  }

  let intervalId = null;

  const deviceData = ref({
    lux: '',
    temprature: '',
  });

  const badgeStatus = ref({
    value: 'default',
    label: '不在运行',
  });

  const fanData = ref({
    status: 0,
  });

  const ledStatus = ref({
    status: 0,
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
      queryDeviceData({ topic: record.value.deviceName })
        .then((data) => {
          console.log('data: ', data);
          if (data === undefined || data === null || data === '') {
            badgeStatus.value.value = 'error';
            badgeStatus.value.label = '设备出错';
          } else {
            deviceData.value.lux = data.lux;
            deviceData.value.temprature = data.temprature;
            badgeStatus.value.value = 'processing';
            badgeStatus.value.label = '正在运行';
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  async function enableDevice(record: Recordable) {
    isTimerActive.value = true;
    await handleSubscribe(record);
  }

  async function disableDevice(record: Recordable) {
    isTimerActive.value = false;
  }

  async function handleOpenLed(record: Recordable) {
    if (isTimerActive.value) {
      deviceOpenLight({
        deviceid: record.deviceId,
        devicename: record.deviceName,
        devicestatus: record.deviceStatus,
        img: record.img,
        ledcmd: 1,
        topic: record.deviceName + '/get',
      }).then((data) => {
        // isTimerActive.value = true;
        if (data.result) {
          ledStatus.value.status = 1;
        } else {
          showMessage(t('开启led失败'));
        }
        console.log('openLed: ', data);
      });
    }
  }

  async function handleCloseLed(record: Recordable) {
    if (isTimerActive.value) {
      deviceCloseLight({
        deviceId: record.deviceId,
        deviceName: record.deviceName,
        deviceStatus: record.deviceStatus,
        img: record.img,
        ledcmd: 0,
        topic: record.deviceName + '/get',
      }).then((data) => {
        // isTimerActive.value = false;
        if (data.result) {
          ledStatus.value.status = 0;
        } else {
          showMessage(t('关闭led失败'));
        }
        console.log('closeLed: ', data);
      });
    }
  }
  async function handleSubscribe(record: Recordable) {
    const params = { topic: record.deviceName };
    const res = await subscribeTopic(params);
    showMessage(res.message);
  }

  async function handleFanOpen(record: Recordable) {
    if (isTimerActive.value) {
      deviceOpenFan({
        deviceId: record.deviceId,
        deviceName: record.deviceName,
        deviceStatus: record.deviceStatus,
        fan: 1,
        topic: record.deviceName + '/get',
      })
        .then((data) => {
          fanData.value.status = 1;
          console.log('closeLed: ', data);
        })
        .catch((e) => {
          badgeStatus.value.value = 'error';
          badgeStatus.value.label = 'fan 出错';
          showMessage(t('开启风扇失败'));
          console.log(e);
        });
    }
  }

  async function handleFanClose(record: Recordable) {
    if (isTimerActive.value) {
      deviceCloseFan({
        deviceId: record.deviceId,
        deviceName: record.deviceName,
        deviceStatus: record.deviceStatus,
        fan: 0,
        topic: record.deviceName + '/get',
      })
        .then((data) => {
          fanData.value.status = 0;
          console.log('closeLed: ', data);
        })
        .catch((e) => {
          badgeStatus.value.value = 'error';
          badgeStatus.value.label = 'fan 出错';
          showMessage(t('关闭风扇失败'));
          console.log(e);
        });
    }
  }
</script>
