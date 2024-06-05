<!--
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
-->
<template>
  <div>
    <BasicTable @register="registerTable" @fetch-success="fetchSuccess">
      <template #tableTitle>
        <Icon :icon="getTitle.icon" class="m-1 pr-1" />
        <span> {{ getTitle.value }} </span>
      </template>
      <template #toolbar>
        <a-button @click="expandAll" :title="t('展开一级')">
          <Icon icon="i-bi:chevron-double-down" />
          {{ t('展开') }}
        </a-button>
        <a-button @click="collapseAll" :title="t('折叠全部')">
          <Icon icon="i-bi:chevron-double-up" />
          {{ t('折叠') }}
        </a-button>
        <a-button type="primary" @click="handleForm({})" v-auth="'device:device:edit'">
          <Icon icon="i-fluent:add-12-filled" />
          {{ t('新增') }}
        </a-button>
      </template>
      <template #firstColumn="{ record }">
        <a @click="handleDetail({ deviceId: record.deviceId })">
          {{ record.deviceName }}
        </a>
      </template>
    </BasicTable>
    <InputForm @register="registerDrawer" @success="handleSuccess" />
  </div>
</template>
<script lang="ts" setup name="ViewsDeviceDeviceList">
  import { unref, watch, nextTick, onMounted } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import {
    deviceDelete,
    deviceListData,
    deviceOpenLight,
    subscribeTopic,
  } from '/@/api/device/device';
  import { deviceDisable, deviceEnable } from '/@/api/device/device';
  import { useDrawer } from '/@/components/Drawer';
  import { FormProps } from '/@/components/Form';
  import InputForm from './form.vue';

  const props = defineProps({
    treeCode: String,
  });

  const { t } = useI18n('device.device');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const getTitle = {
    icon: meta.icon || 'i-ant-design:book-outlined',
    value: meta.title || t('设备'),
  };

  const searchForm: FormProps = {
    baseColProps: { lg: 6, md: 8 },
    labelWidth: 90,
    schemas: [
      {
        label: t('device_name '),
        field: 'deviceName',
        component: 'Input',
      },
      {
        label: t('device_status : 设备状态'),
        field: 'deviceStatus',
        component: 'Input',
      },
      {
        label: t('img '),
        field: 'img',
        component: 'Input',
      },
    ],
  };

  const tableColumns: BasicColumn[] = [
    {
      title: t('device_name '),
      dataIndex: 'deviceName',
      width: 230,
      align: 'left',
      slot: 'firstColumn',
    },
    {
      title: t('排序号'),
      dataIndex: 'treeSort',
      width: 130,
      align: 'center',
    },
    {
      title: t('是否订阅'),
      dataIndex: 'deviceStatus',
      width: 130,
      align: 'center',
    },
    {
      title: t('img '),
      dataIndex: 'img',
      width: 130,
      align: 'left',
    },
  ];

  const actionColumn: BasicColumn = {
    width: 160,
    actions: (record: Recordable) => [
      {
        icon: 'i-ant-design:eye-outlined',
        title: t('订阅主题'),
        onClick: () => {
          handleSubscribe(record);
        },
        auth: 'device:device:edit',
      },
      {
        icon: 'i-clarity:note-edit-line',
        title: t('编辑device : 存储设备层次的根表'),
        onClick: handleForm.bind(this, { deviceId: record.deviceId }),
        auth: 'device:device:edit',
      },
      {
        icon: 'i-ant-design:stop-outlined',
        color: 'error',
        title: t('停用device : 存储设备层次的根表'),
        popConfirm: {
          title: t('是否确认停用device : 存储设备层次的根表'),
          confirm: handleDisable.bind(this, record),
        },
        auth: 'device:device:edit',
        ifShow: () => record.status === '0',
      },
      {
        icon: 'i-ant-design:check-circle-outlined',
        color: 'success',
        title: t('启用device : 存储设备层次的根表'),
        popConfirm: {
          title: t('是否确认启用device : 存储设备层次的根表'),
          confirm: handleEnable.bind(this, record),
        },
        auth: 'device:device:edit',
        ifShow: () => record.status === '2',
      },
      {
        icon: 'i-ant-design:delete-outlined',
        color: 'error',
        title: t('删除device : 存储设备层次的根表'),
        popConfirm: {
          title: t('是否确认删除device : 存储设备层次的根表'),
          confirm: handleDelete.bind(this, record),
        },
        auth: 'device:device:edit',
      },
      {
        icon: 'i-fluent:add-circle-24-regular',
        title: t('新增下级device : 存储设备层次的根表'),
        onClick: handleForm.bind(this, {
          parentCode: record.id,
          parentName: record.deviceName,
        }),
        auth: 'device:device:edit',
      },
    ],
  };

  const [registerDrawer, { openDrawer }] = useDrawer();
  const [registerTable, { reload, expandAll, collapseAll, expandCollapse, getForm }] = useTable({
    api: deviceListData,
    beforeFetch: (params) => {
      return params;
    },
    columns: tableColumns,
    actionColumn: actionColumn,
    formConfig: searchForm,
    showTableSetting: true,
    useSearchForm: true,
    isTreeTable: true,
    pagination: false,
    canResize: true,
  });

  watch(
    () => props.treeCode,
    async () => {
      await getForm().setFieldsValue({
        deviceId: props.treeCode,
      });
      reload();
    },
  );

  function fetchSuccess() {
    if (props.treeCode) {
      nextTick(expandAll);
    }
  }

  function handleForm(record: Recordable) {
    openDrawer(true, record);
  }

  function handleDetail(record: Recordable) {
    openDrawer(true, { deviceId: record.deviceId, isDetail: true });
  }

  async function handleDisable(record: Recordable) {
    const params = { deviceId: record.deviceId };
    const res = await deviceDisable(params);
    showMessage(res.message);
    handleSuccess(record);
  }

  async function handleEnable(record: Recordable) {
    const params = { deviceId: record.deviceId };
    const res = await deviceEnable(params);
    showMessage(res.message);
    handleSuccess(record);
  }

  async function handleDelete(record: Recordable) {
    const params = { deviceId: record.deviceId };
    const res = await deviceDelete(params);
    showMessage(res.message);
    handleSuccess(record);
  }

  async function handleSubscribe(record: Recordable) {
    const params = { topic: record.deviceName + '/get' };
    const res = await subscribeTopic(params);
    showMessage(res.message);
    handleSuccess(record);
  }

  function handleSuccess(record: Recordable) {
    reload({ record });
  }
</script>
