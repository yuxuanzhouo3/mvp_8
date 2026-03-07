package co.median.android;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.fragment.app.Fragment;

public class RefundPolicyFragment extends Fragment {
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_refund_policy, container, false);
        TextView content = view.findViewById(R.id.contentText);
        
        String text = "💰 退款政策\n" +
                "退款条件\n" +
                "在以下情况下，您可以申请退款：\n\n" +
                "• 重复扣费：首次自动续费或系统错误导致的重复扣费\n" +
                "• 服务故障：连续 7 天无法正常使用服务\n" +
                "• 功能不符：实际功能与宣传严重不符\n\n" +
                "退款金额计算\n" +
                "• 未使用期间：按未使用的天数比例退款\n" +
                "• 手续费：扣除第三方支付平台手续费\n" +
                "• 最低退款：单次退款金额不低于 ¥1.00\n\n" +
                "退款流程\n" +
                "• 提交申请：发送邮件至 mornscience@gmail.com 提交退款申请\n" +
                "• 审核处理：我们将在 1-3 个工作日内审核\n" +
                "• 退款确认：审核通过后发送退款确认邮件\n" +
                "• 资金退回：3-7 个工作日内原路退回\n\n" +
                "申请材料\n" +
                "申请退款时，请提供：\n\n" +
                "• 用户账户信息\n" +
                "• 订单号或交易流水号\n" +
                "• 退款原因说明\n" +
                "• 相关证据材料（如截图）\n\n" +
                "不退款情况\n" +
                "以下情况不予退款：\n\n" +
                "• 超过退款时限的申请\n" +
                "• 已充分使用服务功能\n" +
                "• 因用户个人原因导致的无法使用\n" +
                "• 违反服务条款被终止服务\n" +
                "• 恶意退款申请\n\n" +
                "退款方式（详细到账时间）\n" +
                "• 原路退回：退款将原路返回到您的支付账户\n" +
                "• 到账时间：微信支付 1-3 个工作日，其他方式 3-7 个工作日\n\n" +
                "争议处理\n" +
                "如果您对退款处理结果有异议：\n\n" +
                "• 可以申请重新审核\n" +
                "• 提供补充证据材料\n" +
                "• 通过客服渠道沟通解决\n" +
                "• 必要时可向相关监管部门投诉\n\n" +
                "政策更新\n" +
                "本退款政策可能会不时更新。重大变更将通过应用内通知告知用户。继续使用服务即表示您接受更新后的政策。";
        
        content.setText(text);
        return view;
    }
}
