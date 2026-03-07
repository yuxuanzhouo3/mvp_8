package co.median.android;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class AgreementActivity extends AppCompatActivity {
    private static final String PREF_NAME = "AgreementPrefs";
    private static final String PREF_AGREED = "agreed_to_terms";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_agreement);

        ViewPager2 viewPager = findViewById(R.id.viewPager);
        TabLayout tabLayout = findViewById(R.id.tabLayout);
        Button agreeButton = findViewById(R.id.agreeButton);
        Button exitButton = findViewById(R.id.exitButton);

        AgreementPagerAdapter adapter = new AgreementPagerAdapter(this);
        viewPager.setAdapter(adapter);

        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            switch (position) {
                case 0:
                    tab.setText("服务条款");
                    break;
                case 1:
                    tab.setText("隐私政策");
                    break;
                case 2:
                    tab.setText("退款政策");
                    break;
            }
        }).attach();

        agreeButton.setOnClickListener(v -> {
            // 保存已同意标志
            SharedPreferences prefs = getSharedPreferences(PREF_NAME, MODE_PRIVATE);
            prefs.edit().putBoolean(PREF_AGREED, true).apply();

            // 启动MainActivity
            android.content.Intent intent = new android.content.Intent(AgreementActivity.this, MainActivity.class);
            startActivity(intent);
            finish();
        });

        exitButton.setOnClickListener(v -> {
            finish();
            System.exit(0);
        });
    }

    public static boolean hasAgreed(android.content.Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, MODE_PRIVATE);
        return prefs.getBoolean(PREF_AGREED, false);
    }
}
