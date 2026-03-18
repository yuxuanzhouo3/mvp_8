# SSL证书上传步骤

## Jeff发来的文件说明

文件: `site.mornscience.top_nginx.zip`

解压后包含:
- `xxx.pem` 文件 (证书文件)
- `xxx.key` 文件 (私钥文件)

## 上传位置

**云开发控制台** (不是微信开发者工具!)

### 路径:
```
云开发控制台 → 更多 → 设置 → SSL证书
```

或者按照图片中的路径:
```
云开发 → 更多(右上角) → 设置 → 选择证书 → SSL证书
```

## 证书类型选择

根据Jeff提供的文件名 `site.mornscience.top_nginx.zip`:

**选择类型**: **Nginx (适用大部分分场景) (pem文件、crt文件、key文件)**

因为文件包含了:
- `.pem` 文件 ✅
- `.key` 文件 ✅

## 上传步骤

### 1. 解压Jeff发来的zip文件

解压 `site.mornscience.top_nginx.zip` 到桌面

### 2. 打开云开发控制台

**重要**: 不是在微信开发者工具中,而是在浏览器中!

访问: https://console.cloud.tencent.com/tcb

或者:
1. 微信开发者工具 → 云开发按钮
2. 点击右上角"控制台"(会打开浏览器)

### 3. 找到静态托管SSL证书配置

路径:
```
云开发控制台 → 静态网站托管 → 设置 → 自定义域名
```

### 4. 添加域名并上传证书

1. **点击"添加域名"**
2. **输入域名**: `site.mornscience.top`
3. **选择证书类型**: `Nginx (适用大部分场景)`
4. **上传证书文件**:
   - **证书文件 (.pem)**: 选择解压后的 `.pem` 文件
   - **私钥文件 (.key)**: 选择解压后的 `.key` 文件
5. **点击"保存"**

## 常见问题

### Q: 在哪里上传证书?

A: 有两个位置可以上传:

**位置1: 云开发静态托管** (推荐)
```
云开发控制台 → 静态网站托管 → 设置 → 自定义域名 → 添加域名
```

**位置2: 腾讯云SSL控制台**
```
https://console.cloud.tencent.com/ssl
```

### Q: 为什么有这么多证书类型?

A: 不同的Web服务器使用不同格式:
- **Nginx**: 使用 .pem + .key (Jeff发的就是这个)
- **Apache**: 使用 .crt + .key
- **Tomcat**: 使用 .pfx 或 .jks
- **IIS**: 使用 .pfx

Jeff已经下载了Nginx格式,所以选择**Nginx**即可。

### Q: 如果两个控制台都要上传?

A: 
1. **先上传到云开发静态托管** (用于小程序业务域名)
2. **再上传到腾讯云SSL控制台** (用于其他服务)

### Q: .pem和.crt有什么区别?

A: 其实内容一样,只是扩展名不同:
- `.pem` = Privacy Enhanced Mail (文本格式)
- `.crt` = Certificate (也是文本格式)

可以互换使用。

## 上传后的DNS配置

上传证书后,还需要配置DNS:

### 在腾讯云DNS控制台添加记录

访问: https://console.cloud.tencent.com/cns

```
记录类型: CNAME
主机记录: site
记录值: cloudbase-1gnip2iaa08260e5-1381819971.tcloudbaseapp.com
TTL: 600
```

## 验证步骤

1. **等待5-10分钟** (DNS生效时间)

2. **测试域名解析**:
   ```bash
   nslookup site.mornscience.top
   ```

3. **访问域名**:
   ```
   https://site.mornscience.top
   ```

   应该能看到静态托管的内容,且有HTTPS锁标志🔒

4. **上传域名校验文件后访问**:
   ```
   https://site.mornscience.top/wx校验文件名.txt
   ```

   应该能看到文件内容

## 总结

**完整流程**:

1. ✅ 解压Jeff发的 `site.mornscience.top_nginx.zip`
2. ✅ 打开云开发控制台 (浏览器,不是微信开发者工具)
3. ✅ 静态网站托管 → 设置 → 自定义域名 → 添加域名
4. ✅ 选择证书类型: Nginx
5. ✅ 上传 .pem 和 .key 文件
6. ✅ 配置DNS (CNAME记录)
7. ✅ 等待生效
8. ✅ 上传微信校验文件
9. ✅ 在微信公众平台验证业务域名
