<!--
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
-->
<template>
  <PageWrapper :sidebarWidth="230">
    <template #sidebar>
      <BasicTree
        :title="t('device : 存储设备层次的根表')"
        :search="true"
        :toolbar="true"
        :api="deviceTreeData"
        :defaultExpandLevel="2"
        @select="handleSelect"
      />
    </template>
    <ListView :treeCode="treeCode" />
  </PageWrapper>
</template>
<script lang="ts" setup name="ViewsDeviceDeviceIndex">
  import { ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { PageWrapper } from '/@/components/Page';
  import { BasicTree } from '/@/components/Tree';
  import { deviceTreeData } from '/@/api/device/device';
  import ListView from './list.vue';

  const { t } = useI18n('device.device');
  const treeCode = ref<string>('');

  function handleSelect(keys: string[]) {
    treeCode.value = keys[0];
  }
</script>
