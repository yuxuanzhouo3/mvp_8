package co.median.android;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class AgreementPagerAdapter extends FragmentStateAdapter {
    public AgreementPagerAdapter(@NonNull FragmentActivity fragmentActivity) {
        super(fragmentActivity);
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        switch (position) {
            case 0:
                return new ServiceTermsFragment();
            case 1:
                return new PrivacyPolicyFragment();
            case 2:
                return new RefundPolicyFragment();
            default:
                return new ServiceTermsFragment();
        }
    }

    @Override
    public int getItemCount() {
        return 3;
    }
}
