# Extension Analysis Key Points

| Field | Risk Signal |
|-------|-------------|
| host_permissions `<all_urls>` | Can read/write any site |
| webRequestBlocking | MITM-style request rewriting |
| nativeMessaging | Breaks out of the browser to the local machine |
| externally_connectable | Web pages can drive the extension |

MV3: focus on the service_worker lifecycle and declarativeNetRequest.