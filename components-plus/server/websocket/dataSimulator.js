/**
 * 数据模拟器
 * 用于生成测试数据并推送到各个通道
 */

const { ChannelType } = require('./types');

class DataSimulator {
  constructor(server) {
    this.server = server;
    this.timers = [];
  }

  /**
   * 启动所有数据模拟
   */
  start() {
    // 模拟威胁感知大屏数据
    const threatTimer = setInterval(() => {
      const threatData = {
        id: Date.now(),
        type: 'threat_alert',
        level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        source: `192.168.1.${Math.floor(Math.random() * 255)}`,
        target: `10.0.0.${Math.floor(Math.random() * 255)}`,
        description: '检测到可疑网络活动',
        count: Math.floor(Math.random() * 100)
      };
      this.server.broadcast(ChannelType.THREAT_DASHBOARD, threatData);
    }, 5000); // 每5秒推送一次
    this.timers.push(threatTimer);

    // 模拟密网日志数据
    const logTimer = setInterval(() => {
      const logData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
        source: 'honeypot',
        message: '检测到攻击尝试',
        details: {
          ip: `172.16.0.${Math.floor(Math.random() * 255)}`,
          port: [22, 80, 443, 3306][Math.floor(Math.random() * 4)],
          protocol: ['ssh', 'http', 'https', 'mysql'][Math.floor(Math.random() * 4)]
        }
      };
      this.server.broadcast(ChannelType.HONEYPOT_LOG, logData);
    }, 3000); // 每3秒推送一次
    this.timers.push(logTimer);

    // 模拟诱饵生成内容
    const decoyTimer = setInterval(() => {
      const decoyData = {
        id: Date.now(),
        type: 'decoy_generated',
        name: `诱饵_${Math.floor(Math.random() * 1000)}`,
        category: ['file', 'service', 'credential'][Math.floor(Math.random() * 3)],
        content: {
          filename: `decoy_file_${Date.now()}.txt`,
          size: Math.floor(Math.random() * 10000),
          location: `/var/decoy/${Math.floor(Math.random() * 100)}`
        },
        status: 'active'
      };
      this.server.broadcast(ChannelType.DECOY_GENERATION, decoyData);
    }, 7000); // 每7秒推送一次
    this.timers.push(decoyTimer);
  }

  /**
   * 停止所有数据模拟
   */
  stop() {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
  }
}

module.exports = DataSimulator;

