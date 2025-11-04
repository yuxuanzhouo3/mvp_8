package com.sitehub.app;

import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * SiteHub Android App - TWA (Trusted Web Activity)
 *
 * 功能：加载 https://www.mornhub.help 作为全屏应用
 * 特点：
 * - 无地址栏，全屏体验
 * - 使用 TWA（Trusted Web Activity）
 * - 通过 Digital Asset Links 验证
 * - 自动适配中文字体
 * - 支持离线 Service Worker
 */
public class MainActivity extends LauncherActivity {

    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://www.mornhub.help");
    }
}
