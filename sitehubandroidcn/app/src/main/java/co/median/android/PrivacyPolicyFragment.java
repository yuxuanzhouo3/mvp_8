package co.median.android;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.fragment.app.Fragment;

public class PrivacyPolicyFragment extends Fragment {
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_privacy_policy, container, false);
        TextView content = view.findViewById(R.id.contentText);
        
        String text = "🔒 隐私政策\n" +
                "1. 信息收集\n" +
                "我们收集以下类型的信息：\n\n" +
                "• 账户信息：微信昵称、头像、OpenID\n" +
                "• 使用数据：收藏网站、访问记录、搜索历史\n" +
                "• 设备信息：设备型号、操作系统版本\n" +
                "• 位置信息：用于推荐本地化内容（可选）\n\n" +
                "2. 信息使用\n" +
                "我们使用收集的信息用于：\n\n" +
                "• 提供和改善服务\n" +
                "• 个性化用户体验\n" +
                "• 技术支持和客服服务\n" +
                "• 安全监控和欺诈防护\n\n" +
                "3. 信息保护\n" +
                "我们采用行业标准的安全措施保护您的信息：\n\n" +
                "• 数据加密传输和存储\n" +
                "• 访问控制和身份验证\n" +
                "• 定期安全审计\n" +
                "• 员工保密培训\n\n" +
                "4. 信息共享\n" +
                "我们不会出售、出租或交易您的个人信息。仅在以下情况下共享：\n\n" +
                "• 获得您的明确同意\n" +
                "• 法律要求或法院命令\n" +
                "• 保护我们的权利和财产\n" +
                "• 与可信第三方服务提供商（如支付处理）\n\n" +
                "5. 数据保留\n" +
                "我们根据以下原则保留您的数据：\n\n" +
                "• 账户信息：账户存在期间\n" +
                "• 使用数据：最多 3 年\n" +
                "• 法律要求：根据相关法律要求\n\n" +
                "6. 您的权利\n" +
                "您拥有以下权利：\n\n" +
                "• 访问和查看您的个人信息\n" +
                "• 更正不准确的信息\n" +
                "• 删除您的账户和数据\n" +
                "• 限制信息处理\n" +
                "• 数据可携性\n\n" +
                "7. Cookie 和跟踪技术\n" +
                "我们使用 Cookie 和类似技术来：\n\n" +
                "• 记住您的偏好设置\n" +
                "• 分析使用模式\n" +
                "• 改善用户体验\n\n" +
                "您可以通过浏览器设置管理 Cookie 偏好。\n\n" +
                "8. 儿童隐私\n" +
                "我们的服务不针对 13 岁以下的儿童。如果我们发现收集了儿童的个人信息，将立即删除。\n\n" +
                "9. 隐私政策更新\n" +
                "我们可能不时更新本隐私政策。重大变更将通过应用内通知告知您。\n\n" +
                "10. 联系我们\n" +
                "如果您对本隐私政策有任何疑问，请发送邮件至：mornscience@gmail.com";
        
        content.setText(text);
        return view;
    }
}
