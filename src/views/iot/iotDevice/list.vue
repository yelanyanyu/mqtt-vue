<!--
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #tableTitle>
        <Icon :icon="getTitle.icon" class="m-1 pr-1" />
        <span> {{ getTitle.value }} </span>
      </template>
      <template #toolbar>
        <a-button type="primary" @click="handleForm({})" v-auth="'iot:iotDevice:edit'">
          <Icon icon="i-fluent:add-12-filled" /> {{ t('新增') }}
        </a-button>
      </template>
      <template #firstColumn="{ record }">
        <a @click="handleForm({ id: record.id })">
          {{ record.deviceName }}
        </a>
      </template>
    </BasicTable>
    <InputForm @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script lang="ts" setup name="ViewsIotIotDeviceList">
  import { unref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { iotDeviceDelete, iotDeviceListData } from '/@/api/iot/iotDevice';
  import { useDrawer } from '/@/components/Drawer';
  import { FormProps } from '/@/components/Form';
  import InputForm from './form.vue';

  const { t } = useI18n('iot.iotDevice');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const getTitle = {
    icon: meta.icon || 'i-ant-design:book-outlined',
    value: meta.title || t('IoT_device管理'),
  };

  const searchForm: FormProps = {
    baseColProps: { lg: 6, md: 8 },
    labelWidth: 90,
    schemas: [
      {
        label: t('设备名称'),
        field: 'deviceName',
        component: 'Input',
      },
      {
        label: t('设备类型'),
        field: 'deviceType',
        component: 'Input',
      },
      {
        label: t('设备位置'),
        field: 'location',
        component: 'Input',
      },
      {
        label: t('ip'),
        field: 'ip',
        component: 'Input',
      },
      {
        label: t('mac_address'),
        field: 'macAddress',
        component: 'Input',
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
    ],
  };

  const tableColumns: BasicColumn[] = [
    {
      title: t('设备名称'),
      dataIndex: 'deviceName',
      key: 'a.device_name',
      sorter: true,
      width: 230,
      align: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('设备类型'),
      dataIndex: 'deviceType',
      key: 'a.device_type',
      sorter: true,
      width: 130,
      align: 'left',
    },
    {
      title: t('设备位置'),
      dataIndex: 'location',
      key: 'a.location',
      sorter: true,
      width: 130,
      align: 'left',
    },
    {
      title: t('ip'),
      dataIndex: 'ip',
      key: 'a.ip',
      sorter: true,
      width: 130,
      align: 'left',
    },
    {
      title: t('mac_address'),
      dataIndex: 'macAddress',
      key: 'a.mac_address',
      sorter: true,
      width: 130,
      align: 'left',
    },
    {
      title: t('更新时间'),
      dataIndex: 'lastUpdateDate',
      key: 'a.last_update_date',
      sorter: true,
      width: 130,
      align: 'center',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'i-clarity:note-edit-line',
        title: t('编辑IoT_device'),
        onClick: handleForm.bind(this, { id: record.id }),
        auth: 'iot:iotDevice:edit',
      },
      {
        icon: 'i-ant-design:delete-outlined',
        color: 'error',
        title: t('删除IoT_device'),
        popConfirm: {
          title: t('是否确认删除IoT_device'),
          confirm: handleDelete.bind(this, record),
        },
        auth: 'iot:iotDevice:edit',
      },
    ],
  };

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload }] = useTable({
    api: iotDeviceListData,
    beforeFetch: (params) => {
      return params;
    },
    columns: tableColumns,
    actionColumn: actionColumn,
    formConfig: searchForm,
    showTableSetting: true,
    useSearchForm: true,
    canResize: true,
  });

  function handleForm(record: Recordable) {
    openDrawer(true, record);
  }

  async function handleDelete(record: Recordable) {
    const params = { id: record.id };
    const res = await iotDeviceDelete(params);
    showMessage(res.message);
    handleSuccess(record);
  }

  function handleSuccess(record: Recordable) {
    reload({ record });
  }
</script>
