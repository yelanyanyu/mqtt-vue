/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
 */
import { defHttp } from '/@/utils/http/axios';
import { useGlobSetting } from '/@/hooks/setting';
import { TreeDataModel, TreeModel } from '../model/baseModel';

const { adminPath } = useGlobSetting();

export interface Device extends TreeModel<Device> {
  deviceId?: string; // device_id : 设备的唯一标识
  deviceName?: string; // device_name : 设备名称
  deviceStatus?: number; // device_status : 设备状态(1-active,0-inactive)
  img?: string; // img : 保存图片路径-通常存在oss中
}

export interface LEDVO {
  topic: string;
  ledcmd: number;
}

export const deviceList = (params?: Device | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/list', params });

export const deviceListData = (params?: Device | any) =>
  defHttp.post<Device[]>({ url: adminPath + '/device/device/listData', params });

export const deviceForm = (params?: Device | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/form', params });

export const deviceCreateNextNode = (params?: Device | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/createNextNode', params });

export const deviceSave = (params?: any, data?: Device | any) =>
  defHttp.postJson<Device>({ url: adminPath + '/device/device/save', params, data });

export const deviceDisable = (params?: Device | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/disable', params });

export const deviceEnable = (params?: Device | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/enable', params });

export const deviceDelete = (params?: Device | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/delete', params });

export const deviceTreeData = (params?: any) =>
  defHttp.get<TreeDataModel[]>({ url: adminPath + '/device/device/treeData', params });
export const deviceOpenLight = (params?: LEDVO | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/openLight', params });
export const deviceCloseLight = (params?: LEDVO | any) =>
  defHttp.get<Device>({ url: adminPath + '/device/device/closeLight', params });
