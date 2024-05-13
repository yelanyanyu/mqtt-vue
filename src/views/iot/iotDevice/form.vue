<!--
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
-->
<template>
  <BasicDrawer
    v-bind="$attrs"
    :showFooter="true"
    :okAuth="'iot:iotDevice:edit'"
    @register="registerDrawer"
    @ok="handleSubmit"
    width="60%"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="m-1 pr-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm" />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsIotIotDeviceForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { IotDevice, iotDeviceSave, iotDeviceForm } from '/@/api/iot/iotDevice';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('iot.iotDevice');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<IotDevice>({} as IotDevice);

  const getTitle = computed(() => ({
    icon: meta.icon || 'i-ant-design:book-outlined',
    value: record.value.isNewRecord ? t('新增IoT_device') : t('编辑IoT_device'),
  }));

  const inputFormSchemas: FormSchema[] = [
    {
      label: t('设备名称'),
      field: 'deviceName',
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      required: true,
    },
    {
      label: t('设备类型'),
      field: 'deviceType',
      component: 'Input',
      componentProps: {
        maxlength: 255,
      },
      required: true,
    },
    {
      label: t('设备位置'),
      field: 'location',
      component: 'Input',
      componentProps: {
        maxlength: 255,
      },
    },
    {
      label: t('ip'),
      field: 'ip',
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
    },
    {
      label: t('mac_address'),
      field: 'macAddress',
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
    },
    {
      label: t('更新时间'),
      field: 'lastUpdateDate',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD HH:mm',
        showTime: { format: 'HH:mm' },
      },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    setDrawerProps({ loading: true });
    await resetFields();
    const res = await iotDeviceForm(data);
    record.value = (res.iotDevice || {}) as IotDevice;
    record.value.__t = new Date().getTime();
    setFieldsValue(record.value);
    setDrawerProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setDrawerProps({ confirmLoading: true });
      const params: any = {
        isNewRecord: record.value.isNewRecord,
        id: record.value.id,
      };
      // console.log('submit', params, data, record);
      const res = await iotDeviceSave(params, data);
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
</script>
