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
    <a-button
      @click="
        deviceOpenLight({
          deviceId: record.deviceId,
          deviceName: record.deviceName,
          deviceStatus: record.deviceStatus,
          img: record.img,
          ledcmd: 1,
          topic: record.deviceName + '/get',
        })
      "
    >
      {{ t('开灯') }}
    </a-button>
    <a-button
      @click="
        deviceCloseLight({
          deviceId: record.deviceId,
          deviceName: record.deviceName,
          deviceStatus: record.deviceStatus,
          img: record.img,
          ledcmd: 0,
          topic: record.deviceName + '/get',
        })
      "
    >
      {{ t('关灯') }}
    </a-button>
    <Description
      title="基础示例"
      :collapseOptions="{ canExpand: true, helpMessage: 'help me' }"
      :column="3"
      :data="mockData"
      :schema="schema"
    />
    <Description @register="register" class="mt-4" />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsDeviceDeviceForm">
  import { ref, unref, computed, onMounted, onBeforeMount } from 'vue';
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
  } from '/@/api/device/device';
  import { defineComponent } from 'vue';
  import { Alert } from 'ant-design-vue';
  import { Description, DescItem, useDescription } from '/@/components/Description/index';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let intervalId = null;
  onMounted(() => {
    intervalId = setInterval(() => {}, 3000);
  });

  onBeforeMount(() => {
    if (intervalId) clearInterval(intervalId);
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

  const mockData: any = {
    deviceName: 'deviceName',
    deviceStatus: 'deviceStatus',
    runningStatus: 'runningStatus',
  };
  const schema: DescItem[] = [
    {
      field: 'deviceName',
      label: '设备名称',
    },
    {
      field: 'deviceStatus',
      label: '设备状态',
      render: (curVal, data) => {
        return `${data.deviceName}-${curVal}`;
      },
    },
    {
      field: 'runningStatus',
      label: '运行状态',
    },
  ];
</script>
