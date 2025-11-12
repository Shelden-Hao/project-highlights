/**
 * WebSocket 使用示例
 * 展示如何使用威胁感知大屏、密网日志、诱饵生成等通道
 */

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../components/websocket/useWebSocket';
import { ChannelType, WSState } from '../components/websocket/types';

// 威胁感知大屏数据接口
interface ThreatData {
  id: number;
  type: string;
  level: 'low' | 'medium' | 'high';
  source: string;
  target: string;
  description: string;
  count: number;
}

// 密网日志数据接口
interface HoneypotLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details: {
    ip: string;
    port: number;
    protocol: string;
  };
}

// 诱饵生成数据接口
interface DecoyData {
  id: number;
  type: string;
  name: string;
  category: 'file' | 'service' | 'credential';
  content: {
    filename: string;
    size: number;
    location: string;
  };
  status: string;
}

// WebSocket 使用示例
export function WebSocketExample() {
  // 威胁感知大屏数据
  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  // 密网日志数据
  const [honeypotLogs, setHoneypotLogs] = useState<HoneypotLog[]>([]);
  // 诱饵生成数据
  const [decoyData, setDecoyData] = useState<DecoyData[]>([]);

  // 初始化 WebSocket 连接
  const { state, connect, disconnect, subscribe, isConnected } = useWebSocket({
    url: 'ws://localhost:3000',
    autoConnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: Infinity,
    heartbeatInterval: 30000,
    heartbeatTimeout: 10000
  });

  // 订阅威胁感知大屏通道
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(ChannelType.THREAT_DASHBOARD, (data: ThreatData) => {
      console.log('收到威胁感知数据:', data);
      setThreatData(prev => [data, ...prev].slice(0, 50)); // 保留最近50条
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  // 订阅密网日志通道
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(ChannelType.HONEYPOT_LOG, (data: HoneypotLog) => {
      console.log('收到密网日志:', data);
      setHoneypotLogs(prev => [data, ...prev].slice(0, 50)); // 保留最近50条
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  // 订阅诱饵生成通道
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(ChannelType.DECOY_GENERATION, (data: DecoyData) => {
      console.log('收到诱饵生成数据:', data);
      setDecoyData(prev => [data, ...prev].slice(0, 50)); // 保留最近50条
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  // 获取状态显示文本
  const getStateText = () => {
    switch (state) {
      case WSState.DISCONNECTED:
        return '未连接';
      case WSState.CONNECTING:
        return '连接中...';
      case WSState.CONNECTED:
        return '已连接';
      case WSState.RECONNECTING:
        return '重连中...';
      case WSState.ERROR:
        return '错误';
      default:
        return '未知';
    }
  };

  // 获取状态颜色
  const getStateColor = () => {
    switch (state) {
      case WSState.CONNECTED:
        return '#52c41a';
      case WSState.CONNECTING:
      case WSState.RECONNECTING:
        return '#faad14';
      case WSState.ERROR:
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>WebSocket 实时数据流示例</h1>

      {/* 连接状态和控制 */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span>连接状态:</span>
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: getStateColor(),
              marginRight: '5px'
            }}
          />
          <strong>{getStateText()}</strong>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={connect}
            disabled={isConnected}
            style={{
              padding: '8px 16px',
              background: isConnected ? '#d9d9d9' : '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected ? 'not-allowed' : 'pointer'
            }}
          >
            连接
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected}
            style={{
              padding: '8px 16px',
              background: !isConnected ? '#d9d9d9' : '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isConnected ? 'not-allowed' : 'pointer'
            }}
          >
            断开
          </button>
        </div>
      </div>

      {/* 威胁感知大屏 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#ff4d4f' }}>威胁感知大屏</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '10px' }}>
          {threatData.length === 0 ? (
            <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '20px' }}>暂无数据</div>
          ) : (
            threatData.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  background: item.level === 'high' ? '#fff1f0' : item.level === 'medium' ? '#fffbe6' : '#f6ffed',
                  borderLeft: `4px solid ${
                    item.level === 'high' ? '#ff4d4f' : item.level === 'medium' ? '#faad14' : '#52c41a'
                  }`,
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  [{item.level.toUpperCase()}] {item.description}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  来源: {item.source} → 目标: {item.target} | 数量: {item.count}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 密网日志 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#1890ff' }}>密网日志</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '10px' }}>
          {honeypotLogs.length === 0 ? (
            <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '20px' }}>暂无数据</div>
          ) : (
            honeypotLogs.map((log, index) => (
              <div
                key={log.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  background: '#fafafa',
                  borderLeft: `4px solid ${
                    log.level === 'error' ? '#ff4d4f' : log.level === 'warning' ? '#faad14' : '#1890ff'
                  }`,
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  [{log.level.toUpperCase()}] {log.message}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {log.timestamp} | IP: {log.details.ip} | 端口: {log.details.port} | 协议: {log.details.protocol}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 诱饵生成内容 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#722ed1' }}>诱饵生成内容</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '10px' }}>
          {decoyData.length === 0 ? (
            <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '20px' }}>暂无数据</div>
          ) : (
            decoyData.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  background: '#f9f0ff',
                  borderLeft: '4px solid #722ed1',
                  borderRadius: '4px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {item.name} ({item.category})
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  文件: {item.content.filename} | 大小: {item.content.size} bytes | 位置: {item.content.location} | 状态: {item.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

