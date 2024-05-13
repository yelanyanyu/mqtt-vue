/**
 * Copyright (c) 2013-Now http://jeesite.com All rights reserved.
 * No deletion without permission, or be held responsible to law.
 * @author yelanyanyu
 */
import { defHttp } from '/@/utils/http/axios';
import { useGlobSetting } from '/@/hooks/setting';
import { BasicModel, Page } from '../model/baseModel';

const { adminPath } = useGlobSetting();

export interface IotDevice extends BasicModel<IotDevice> {
  deviceName?: string; // 设备名称
  deviceType?: string; // 设备类型
  location?: string; // 设备位置
  ip?: string; // ip
  macAddress?: string; // mac_address
  lastUpdateDate?: string; // 更新时间
}

export const iotDeviceList = (params?: IotDevice | any) =>
  defHttp.get<IotDevice>({ url: adminPath + '/iot/iotDevice/list', params });

export const iotDeviceListData = (params?: IotDevice | any) =>
  defHttp.post<Page<IotDevice>>({ url: adminPath + '/iot/iotDevice/listData', params });

export const iotDeviceForm = (params?: IotDevice | any) =>
  defHttp.get<IotDevice>({ url: adminPath + '/iot/iotDevice/form', params });

export const iotDeviceSave = (params?: any, data?: IotDevice | any) =>
  defHttp.postJson<IotDevice>({ url: adminPath + '/iot/iotDevice/save', params, data });

export const iotDeviceDelete = (params?: IotDevice | any) =>
  defHttp.get<IotDevice>({ url: adminPath + '/iot/iotDevice/delete', params });
