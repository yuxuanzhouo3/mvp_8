package com.sitehub.app;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;

/**
 * SiteHub Android App - TWA (Trusted Web Activity)
 *
 * 功能：加载 https://mornhub.help 作为全屏应用
 * 特点：
 * - 无地址栏，全屏体验
 * - 使用Chrome Custom Tabs（TWA模式）
 * - 自动适配中文字体
 * - 支持离线Service Worker
 */
public class MainActivity extends Activity {

    private static final String SITE_URL = "https://mornhub.help";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 创建Chrome Custom Tabs（全屏，无地址栏）
        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setShowTitle(false);
        builder.setUrlBarHidingEnabled(true);

        CustomTabsIntent customTabsIntent = builder.build();
        customTabsIntent.launchUrl(this, Uri.parse(SITE_URL));

        // 启动后立即结束Activity，只保留Custom Tab
        finish();
    }
}
