package co.median.android;

import android.content.Intent;
import android.os.Bundle;

public class LaunchActivity extends MainActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 检查是否已同意协议
        if (!AgreementActivity.hasAgreed(this)) {
            // 首次启动，显示协议弹窗
            Intent intent = new Intent(this, AgreementActivity.class);
            startActivity(intent);
            finish();
            return;
        }
        
        // 已同意协议，调用父类onCreate
        super.onCreate(savedInstanceState);
    }
}
