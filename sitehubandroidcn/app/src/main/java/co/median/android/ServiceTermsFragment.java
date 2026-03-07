package co.median.android;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.fragment.app.Fragment;

public class ServiceTermsFragment extends Fragment {
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_service_terms, container, false);
        TextView content = view.findViewById(R.id.contentText);
        
        String text = "📝 服务条款\n" +
                "1. 服务描述\n" +
                "SiteHub 是一站式网站导航平台，为用户提供便捷的网站收藏、管理和访问服务。我们的服务包括但不限于：\n\n" +
                "• 网站收藏和管理功能\n" +
                "• 个性化网站推荐\n" +
                "• 跨设备数据同步\n" +
                "• 高级搜索和分类功能\n\n" +
                "2. 用户账户\n" +
                "为了使用 SiteHub 的完整功能，您需要注册一个账户。注册时，您需要提供准确的个人信息，并负责保护您的账户安全。 您同意：\n\n" +
                "• 提供真实、准确、完整的注册信息\n" +
                "• 及时更新个人信息以保持准确性\n" +
                "• 保护您的账户密码安全\n" +
                "• 对您账户下的所有活动负责\n\n" +
                "3. 服务使用\n" +
                "您可以使用 SiteHub 的免费功能，高级功能需要付费订阅。 使用服务时，您同意：\n\n" +
                "• 遵守相关法律法规\n" +
                "• 不得滥用平台功能\n" +
                "• 不得进行任何可能损害平台安全的行为\n" +
                "• 尊重其他用户的权利\n\n" +
                "4. 付费服务\n" +
                "SiteHub 提供以下付费订阅计划：\n\n" +
                "• 个人会员：¥19.99/月，¥168/年\n" +
                "• 团队会员：¥299.99/月，¥2520/年\n\n" +
                "订阅服务支持自动续费，您可以在设置中取消自动续费。取消后，服务将持续到当前计费周期结束。\n\n" +
                "5. 知识产权\n" +
                "SiteHub 平台及其原创内容、功能和设计受知识产权法保护。未经许可，您不得：\n\n" +
                "• 复制、修改或分发我们的内容\n" +
                "• 反向工程我们的软件\n" +
                "• 使用我们的商标或标识\n\n" +
                "6. 隐私保护\n" +
                "我们重视您的隐私，详细内容请参阅我们的隐私政策。我们承诺：\n\n" +
                "• 保护您的个人信息安全\n" +
                "• 仅在必要时收集信息\n" +
                "• 不会出售您的个人信息\n\n" +
                "7. 服务变更与终止\n" +
                "我们保留随时修改或终止服务的权利。在合理情况下，我们会提前通知用户。如果您违反本条款，我们可能立即终止您的账户。\n\n" +
                "8. 免责声明\n" +
                "在法律允许的最大范围内，SiteHub 不承担以下责任：\n\n" +
                "• 服务中断或数据丢失\n" +
                "• 第三方网站的可用性或内容\n" +
                "• 间接或偶然损失\n\n" +
                "9. 争议解决\n" +
                "本条款受中华人民共和国法律管辖。如发生争议，双方应友好协商解决；协商不成的，可向有管辖权的人民法院提起诉讼。\n\n" +
                "10. 条款更新\n" +
                "我们可能不时更新本条款。重大变更将通过应用内通知或邮件告知用户。继续使用服务即表示您接受更新后的条款。";
        
        content.setText(text);
        return view;
    }
}
