const CACHE_VER = "wmp-v2";

function send_message_to_client(client, msg) {
    return new Promise(function (resolve, reject) {
        var msg_chan = new MessageChannel(); msg_chan.port1.onmessage = function (event) {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };

        client.postMessage(msg, [msg_chan.port2]);
    });
}

function send_message_to_all_clients(msg) {
    clients.matchAll()
    .then(clients => {
        clients.forEach(client => {
            send_message_to_client(client, msg)
            .then(m => console.log("[Service Worker] From Client:" + msg)
            );
        });
    });
}


self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VER).then(function (cache) {
            return cache.addAll([
                "index.html",
                "/images/icons/icon-144x144.png"
            ]
            );
        })
            .then(self.skipWaiting())
    );
});


self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.filter(function (key) {
                    return !key.startsWith(CACHE_VER);
                })
                    .map(function (key) {
                        return caches.delete(key);
                    })
                );
            })
    )
})

self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
})

self.addEventListener('push', function (event) {
    var notificationText = "You Got New Message!";
    if (event.data) {
        notificationText = event.data.text();
    }

    const title = 'Music Maps';
    const options = {
        body: notificationText,
        icon: './images/icons/icon-128x128.png',
        badge: './images/icons/icon-128x128.png'
    };

    send_message_to_all_clients(notificationText);
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) { //What happens when clicked on Notification
    console.log('[Service Worker] Notification click Received.');
    console.log(event);
    event.notification.close();

    event.waitUntil(
        clients.openWindow("https://syuzu.github.io/MusicMaps/")
    );
});
