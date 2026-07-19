const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withVpnService(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    const vpnService = {
      $: {
        'android:name': '.V2RayVpnService',
        'android:permission': 'android.permission.BIND_VPN_SERVICE',
        'android:exported': 'false'
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'android.net.VpnService'
              }
            }
          ]
        }
      ]
    };

    if (!application.service) {
      application.service = [];
    }
    
    const exists = application.service.some(s => s.$['android:name'] === '.V2RayVpnService');
    if (!exists) {
      application.service.push(vpnService);
    }

    return config;
  });
};
