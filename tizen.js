(function () {
    'use strict';

    console.log('Tizen adapter');

    // Similar to jellyfin-web
    function generateDeviceId() {
        return btoa([navigator.userAgent, new Date().getTime()].join('|')).replace(/=/g, '1');
    }

    function getDeviceId() {
        // Use variable '_deviceId2' to mimic jellyfin-web

        var deviceId = localStorage.getItem('_deviceId2');

        if (!deviceId) {
            deviceId = generateDeviceId();
            localStorage.setItem('_deviceId2', deviceId);
        }

        return deviceId;
    }

    var AppInfo = {
        deviceId: getDeviceId(),
        deviceName: 'Samsung Smart TV',
        appName: 'Jellyfin for Tizen',
        appVersion: tizen.application.getCurrentApplication().appInfo.version
    };

    // List of supported features
    var SupportedFeatures = [
        'exit',
        'exitmenu',
        'externallinkdisplay',
        'htmlaudioautoplay',
        'htmlvideoautoplay',
        'physicalvolumecontrol',
        'displaylanguage',
        'otherapppromotions',
        'targetblank',
        'screensaver',
        'multiserver',
        'subtitleappearancesettings',
        'subtitleburnsettings'
    ];

    var systeminfo;

    function getSystemInfo() {
        if (systeminfo) {
            return Promise.resolve(systeminfo);
        }

        return new Promise(function (resolve) {
            tizen.systeminfo.getPropertyValue('DISPLAY', function (result) {
                var devicePixelRatio = 1;

                if (typeof webapis.productinfo.is8KPanelSupported === 'function' && webapis.productinfo.is8KPanelSupported()){
                    console.log("8K UHD is supported");
                    devicePixelRatio = 4;
                } else if (typeof webapis.productinfo.isUdPanelSupported === 'function' && webapis.productinfo.isUdPanelSupported()){
                    console.log("4K UHD is supported");
                    devicePixelRatio = 2;
                } else {
                    console.log("UHD is not supported");
                }

                systeminfo = Object.assign({}, result, {
                    resolutionWidth: Math.floor(result.resolutionWidth * devicePixelRatio),
                    resolutionHeight: Math.floor(result.resolutionHeight * devicePixelRatio)
                });

                resolve(systeminfo)
            });
        });
    }

    function postMessage() {
        console.log.apply(console, arguments);
    }

    function applyContainerSupport(profile) {
        var video = document.createElement('video');
        var supportsMkv = video.canPlayType('video/x-matroska').replace(/no/, '')
            || video.canPlayType('video/mkv').replace(/no/, '');
        if (supportsMkv) return profile;

        // Recent jellyfin-web profiles assume all Tizen HTML players support
        // MKV and no longer honour enableMkvProgressive:false. On affected TVs
        // that stalls playback before the OSD opens. Let the server remux to
        // a supported container instead; do not remove any codec capability.
        profile.DirectPlayProfiles = (profile.DirectPlayProfiles || []).map(function (entry) {
            if (entry.Type !== 'Video') return entry;
            var containers = String(entry.Container || '').split(',').filter(function (container) {
                return container !== 'mkv' && container !== 'matroska';
            });
            return containers.length ? Object.assign({}, entry, { Container: containers.join(',') }) : null;
        }).filter(function (entry) { return entry !== null; });
        return profile;
    }

    window.NativeShell = {
        AppHost: {
            init: function () {
                postMessage('AppHost.init', AppInfo);
                return getSystemInfo().then(function () {
                    return Promise.resolve(AppInfo);
                });
            },

            appName: function () {
                postMessage('AppHost.appName', AppInfo.appName);
                return AppInfo.appName;
            },

            appVersion: function () {
                postMessage('AppHost.appVersion', AppInfo.appVersion);
                return AppInfo.appVersion;
            },

            deviceId: function () {
                postMessage('AppHost.deviceId', AppInfo.deviceId);
                return AppInfo.deviceId;
            },

            deviceName: function () {
                postMessage('AppHost.deviceName', AppInfo.deviceName);
                return AppInfo.deviceName;
            },

            exit: function () {
                postMessage('AppHost.exit');
                tizen.application.getCurrentApplication().exit();
            },

            getDefaultLayout: function () {
                postMessage('AppHost.getDefaultLayout', 'tv');
                return 'tv';
            },

            getDeviceProfile: function (profileBuilder) {
                postMessage('AppHost.getDeviceProfile');
                return applyContainerSupport(profileBuilder({ enableMkvProgressive: false, enableSsaRender: true }));
            },

            getSyncProfile: function (profileBuilder) {
                postMessage('AppHost.getSyncProfile');
                return applyContainerSupport(profileBuilder({ enableMkvProgressive: false }));
            },

            screen: function () {
                return systeminfo ? {
                    width: systeminfo.resolutionWidth,
                    height: systeminfo.resolutionHeight
                } : null;
            },

            supports: function (command) {
                var isSupported = command && SupportedFeatures.indexOf(command.toLowerCase()) != -1;
                postMessage('AppHost.supports', {
                    command: command,
                    isSupported: isSupported
                });
                return isSupported;
            }
        },

        downloadFile: function (url) {
            postMessage('downloadFile', { url: url });
        },

        enableFullscreen: function () {
            postMessage('enableFullscreen');
        },

        disableFullscreen: function () {
            postMessage('disableFullscreen');
        },

        getPlugins: function () {
            postMessage('getPlugins');
            return [];
        },

        openUrl: function (url, target) {
            postMessage('openUrl', {
                url: url,
                target: target
            });
        },

        updateMediaSession: function (mediaInfo) {
            postMessage('updateMediaSession', { mediaInfo: mediaInfo });
        },

        hideMediaSession: function () {
            postMessage('hideMediaSession');
        }
    };

    window.addEventListener('load', function () {
        tizen.tvinputdevice.registerKey('MediaPlay');
        tizen.tvinputdevice.registerKey('MediaPause');
        tizen.tvinputdevice.registerKey('MediaStop');
        tizen.tvinputdevice.registerKey('MediaTrackPrevious');
        tizen.tvinputdevice.registerKey('MediaTrackNext');
        tizen.tvinputdevice.registerKey('MediaRewind');
        tizen.tvinputdevice.registerKey('MediaFastForward');
    });

    function updateKeys() {
        if (location.hash.indexOf('/queue') !== -1 || location.hash.indexOf('/video') !== -1) {
            // Disable on-screen playback control, if available on the page
            tizen.tvinputdevice.registerKey('MediaPlayPause');
        } else {
            tizen.tvinputdevice.unregisterKey('MediaPlayPause');
        }
    }

    window.addEventListener('viewshow', updateKeys);

    var restoreFocusTimer;
    function refreshRestoredVoiceGuide(event) {
        clearTimeout(restoreFocusTimer);
        if (!event.detail || !event.detail.isRestored || location.hash.indexOf('#/video') === 0) return;
        var view = event.target;
        var element = document.activeElement;
        if (!element || element === document.body || !view.contains(element)
            || element.matches('input, textarea, select, [contenteditable="true"]')) return;

        // On this TV a cached view regains DOM focus before Voice Guide sees
        // its restored accessibility tree. Refresh the same control after the
        // view settles. Never move focus back if the user has already moved on.
        restoreFocusTimer = setTimeout(function () {
            if (document.activeElement !== element || !view.contains(element) || element.offsetParent === null) return;
            element.blur();
            requestAnimationFrame(function () {
                if (document.activeElement === document.body && view.contains(element) && element.offsetParent !== null) {
                    element.focus({ preventScroll: true });
                }
            });
        }, 180);
    }
    window.addEventListener('viewshow', refreshRestoredVoiceGuide);
})();
