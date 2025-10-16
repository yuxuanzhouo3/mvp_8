"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Crown,
  CreditCard,
  Globe,
  FileText,
  LogOut,
  ChevronRight,
  Check,
  Mail,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { useGeo } from "@/contexts/geo-context"
import { useLanguage } from "@/contexts/language-context"
import { createClient } from "@/lib/supabase/client"
import { wxPayment, wxStorage } from "@/lib/adapters/wechat-web"

interface RawSubscription {
  id: string
  user_email: string
  plan_type: "pro" | "team"
  billing_cycle: "monthly" | "yearly" | null
  status: "active" | "expired" | "cancelled" | "pending"
  start_time: string
  expire_time: string
  auto_renew: boolean
  payment_method: string
  platform?: string | null
  next_billing_date?: string | null
  stripe_session_id?: string | null
  paypal_order_id?: string | null
  created_at?: string
  updated_at?: string
}

interface FormattedSubscription extends RawSubscription {
  normalizedCycle: "monthly" | "yearly"
  displayPlan: string
  displayTier: string
  summary: string
  features: string[]
  formattedExpiry: string
  formattedStart: string
  daysLeft: number
  displayAmount: string
  displayCurrency: string
  upgradeAvailable: boolean
}

interface PaymentTransaction {
  id: string
  plan_type: "pro" | "team" | "enterprise"
  billing_cycle: "monthly" | "yearly" | "lifetime" | null
  payment_method: "stripe" | "paypal" | "alipay" | "wechat"
  payment_status: "pending" | "completed" | "failed" | "refunded" | "cancelled"
  gross_amount: number
  currency: string
  payment_time: string | null
  created_at: string
}

type LegalDocumentKey = "termsOfService" | "privacyPolicy" | "autoRenewalTerms" | "cancellationGuide" | "refundPolicy"

const membershipMeta = {
  pro: {
    label: {
      en: "Pro Member",
      zh: "Pro 会员"
    },
    tier: {
      en: "Personal Plan",
      zh: "个人版"
    },
    summary: {
      en: "Unlock advanced personal productivity features",
      zh: "以下 Pro 高级权益已为你开启"
    },
    features: {
      en: [
        "Unlimited collections and custom sites",
        "Cross-device sync in real time",
        "Ad-free experience",
        "Priority support queue",
        "Data export tools",
        "Enhanced recommendations"
      ],
      zh: [
        "收藏与自定义站点不限量",
        "多端实时同步数据",
        "纯净无广告界面",
        "优先客服通道",
        "数据导出与批量管理",
        "智能推荐增强"
      ]
    },
    defaultPrice: {
      monthly: "19.99",
      yearly: "168.00"
    },
    defaultCurrency: {
      en: "USD",
      zh: "CNY"
    },
    upgradeAvailable: true
  },
  team: {
    label: {
      en: "Team Member",
      zh: "Team 会员"
    },
    tier: {
      en: "Team Plan",
      zh: "团队版"
    },
    summary: {
      en: "Collaborate with teammates and manage shared workspaces",
      zh: "团队高级协作权益已为你开启"
    },
    features: {
      en: [
        "Unlimited teammates and shared boards",
        "Team approval workflows",
        "Audit log & analytics",
        "Dedicated success manager",
        "Custom integrations"
      ],
      zh: [
        "团队成员和共享看板不限量",
        "团队协作与审批流程",
        "审计日志与高级统计",
        "专属客户成功经理",
        "自定义系统集成"
      ]
    },
    defaultPrice: {
      monthly: "299.99",
      yearly: "2520.00"
    },
    defaultCurrency: {
      en: "USD",
      zh: "CNY"
    },
    upgradeAvailable: false
  }
}

const legalDocuments: Record<
  LegalDocumentKey,
  { label: { en: string; zh: string }; content: { en: string; zh: string } }
> = {
  termsOfService: {
    label: {
      en: "Terms of Service",
      zh: "服务条款"
    },
    content: {
      zh: String.raw`<h1>SiteHub 服务条款</h1>

<h2>1. 服务描述</h2>
<p>SiteHub是一站式网站导航平台，为用户提供便捷的网站收藏、管理和访问服务。我们的服务包括但不限于：</p>
<ul>
  <li>网站收藏和管理功能</li>
  <li>个性化网站推荐</li>
  <li>跨设备数据同步</li>
  <li>高级搜索和分类功能</li>
</ul>

<h2>2. 用户账户</h2>
<p>为了使用SiteHub的完整功能，您需要注册一个账户。注册时，您需要提供准确的个人信息，并负责保护您的账户安全。</p>
<p><strong>您同意：</strong></p>
<ul>
  <li>提供真实、准确、完整的注册信息</li>
  <li>及时更新个人信息以保持准确性</li>
  <li>保护您的账户密码安全</li>
  <li>对您账户下的所有活动负责</li>
</ul>

<h2>3. 服务使用</h2>
<p>您可以使用SiteHub的免费功能，高级功能需要付费订阅。使用服务时，您同意：</p>
<ul>
  <li>遵守相关法律法规</li>
  <li>不得滥用平台功能</li>
  <li>不得进行任何可能损害平台安全的行为</li>
  <li>尊重其他用户的权利</li>
</ul>

<h2>4. 付费服务</h2>
<p>SiteHub提供以下付费订阅计划：</p>
<ul>
  <li><strong>个人会员</strong>：¥19.99/月，¥168/年</li>
  <li><strong>团队会员</strong>：¥299.99/月，¥2520/年</li>
</ul>
<p>订阅服务支持自动续费，您可以随时在设置中取消自动续费。取消后，服务将持续到当前计费周期结束。</p>

<h2>5. 知识产权</h2>
<p>SiteHub平台及其原创内容、功能和设计受知识产权法保护。未经许可，您不得：</p>
<ul>
  <li>复制、修改或分发我们的内容</li>
  <li>反向工程我们的软件</li>
  <li>使用我们的商标或标识</li>
</ul>

<h2>6. 隐私保护</h2>
<p>我们重视您的隐私，详细内容请参阅我们的隐私政策。我们承诺：</p>
<ul>
  <li>保护您的个人信息安全</li>
  <li>仅在必要时收集信息</li>
  <li>不会出售您的个人信息</li>
</ul>

<h2>7. 服务变更与终止</h2>
<p>我们保留随时修改或终止服务的权利。在合理情况下，我们会提前通知用户。如果您违反本条款，我们可能立即终止您的账户。</p>

<h2>8. 免责声明</h2>
<p>在法律允许的最大范围内，SiteHub不承担以下责任：</p>
<ul>
  <li>服务中断或数据丢失</li>
  <li>第三方网站的可用性或内容</li>
  <li>间接或偶然损失</li>
</ul>

<h2>9. 争议解决</h2>
<p>本条款受中华人民共和国法律管辖。如发生争议，双方应友好协商解决；协商不成的，可向有管辖权的人民法院提起诉讼。</p>

<h2>10. 条款更新</h2>
<p>我们可能不时更新本条款。重大变更将通过应用内通知或邮件告知用户。继续使用服务即表示您接受更新后的条款。</p>`,
      en: String.raw`<h1>SiteHub Terms of Service</h1>

<h2>1. Service Description</h2>
<p>SiteHub is a comprehensive website navigation platform that provides convenient website bookmarking, management, and access services. Our services include but are not limited to:</p>
<ul>
  <li>Website bookmarking and management features</li>
  <li>Personalized website recommendations</li>
  <li>Cross-device data synchronization</li>
  <li>Advanced search and categorization features</li>
</ul>

<h2>2. User Accounts</h2>
<p>To use SiteHub's full features, you need to register an account. When registering, you must provide accurate personal information and are responsible for protecting your account security.</p>
<p><strong>You agree to:</strong></p>
<ul>
  <li>Provide truthful, accurate, and complete registration information</li>
  <li>Update personal information promptly to maintain accuracy</li>
  <li>Protect your account password security</li>
  <li>Be responsible for all activities under your account</li>
</ul>

<h2>3. Service Usage</h2>
<p>You can use SiteHub's free features, while advanced features require paid subscriptions. When using the service, you agree to:</p>
<ul>
  <li>Comply with relevant laws and regulations</li>
  <li>Not abuse platform features</li>
  <li>Not engage in any behavior that may compromise platform security</li>
  <li>Respect other users' rights</li>
</ul>

<h2>4. Paid Services</h2>
<p>SiteHub offers the following paid subscription plans:</p>
<ul>
  <li><strong>Personal Plan</strong>: ¥19.99/month, ¥168/year</li>
  <li><strong>Team Plan</strong>: ¥299.99/month, ¥2520/year</li>
</ul>
<p>Subscription services support auto-renewal, which you can cancel anytime in settings. After cancellation, the service will continue until the current billing cycle ends.</p>

<h2>5. Intellectual Property</h2>
<p>SiteHub platform and its original content, features, and design are protected by intellectual property laws. Without permission, you may not:</p>
<ul>
  <li>Copy, modify, or distribute our content</li>
  <li>Reverse engineer our software</li>
  <li>Use our trademarks or logos</li>
</ul>

<h2>6. Privacy Protection</h2>
<p>We value your privacy. For details, please refer to our Privacy Policy. We promise to:</p>
<ul>
  <li>Protect your personal information security</li>
  <li>Only collect information when necessary</li>
  <li>Never sell your personal information</li>
</ul>

<h2>7. Service Changes and Termination</h2>
<p>We reserve the right to modify or terminate the service at any time. In reasonable circumstances, we will notify users in advance. If you violate these terms, we may immediately terminate your account.</p>

<h2>8. Disclaimer</h2>
<p>To the maximum extent permitted by law, SiteHub is not responsible for:</p>
<ul>
  <li>Service interruptions or data loss</li>
  <li>Third-party website availability or content</li>
  <li>Indirect or incidental losses</li>
</ul>

<h2>9. Dispute Resolution</h2>
<p>These terms are governed by the laws of the People's Republic of China. In case of disputes, both parties should resolve them through friendly negotiation; if negotiation fails, they may file a lawsuit in a court with jurisdiction.</p>

<h2>10. Terms Updates</h2>
<p>We may update these terms from time to time. Major changes will be notified to users through in-app notifications or email. Continued use of the service indicates your acceptance of the updated terms.</p>`
    }
  },
  privacyPolicy: {
    label: {
      en: "Privacy Policy",
      zh: "隐私政策"
    },
    content: {
      zh: String.raw`<h1>SiteHub 隐私政策</h1>

<h2>1. 信息收集</h2>
<p>我们收集以下类型的信息：</p>
<ul>
  <li><strong>账户信息</strong>：微信昵称、头像、OpenID</li>
  <li><strong>使用数据</strong>：收藏网站、访问记录、搜索历史</li>
  <li><strong>设备信息</strong>：设备型号、操作系统版本</li>
  <li><strong>位置信息</strong>：用于推荐本地化内容（可选）</li>
</ul>

<h2>2. 信息使用</h2>
<p>我们使用收集的信息用于：</p>
<ul>
  <li>提供和改善服务</li>
  <li>个性化用户体验</li>
  <li>技术支持和客户服务</li>
  <li>安全监控和欺诈防护</li>
</ul>

<h2>3. 信息保护</h2>
<p>我们采用行业标准的安全措施保护您的信息：</p>
<ul>
  <li>数据加密传输和存储</li>
  <li>访问控制和身份验证</li>
  <li>定期安全审计</li>
  <li>员工保密培训</li>
</ul>

<h2>4. 信息共享</h2>
<p>我们不会出售、出租或交易您的个人信息。仅在以下情况下共享：</p>
<ul>
  <li>获得您的明确同意</li>
  <li>法律要求或法院命令</li>
  <li>保护我们的权利和财产</li>
  <li>与可信第三方服务提供商（如支付处理商）</li>
</ul>

<h2>5. 数据保留</h2>
<p>我们根据以下原则保留您的数据：</p>
<ul>
  <li>账户信息：账户存在期间</li>
  <li>使用数据：最多3年</li>
  <li>法律要求：根据相关法律要求</li>
</ul>

<h2>6. 您的权利</h2>
<p>您拥有以下权利：</p>
<ul>
  <li>访问和查看您的个人信息</li>
  <li>更正不准确的信息</li>
  <li>删除您的账户和数据</li>
  <li>限制信息处理</li>
  <li>数据可携带性</li>
</ul>

<h2>7. Cookie和跟踪技术</h2>
<p>我们使用Cookie和类似技术来：</p>
<ul>
  <li>记住您的偏好设置</li>
  <li>分析使用模式</li>
  <li>改善用户体验</li>
</ul>
<p>您可以通过浏览器设置管理Cookie偏好。</p>

<h2>8. 儿童隐私</h2>
<p>我们的服务不针对13岁以下的儿童。如果我们发现收集了儿童的个人信息，将立即删除。</p>

<h2>9. 隐私政策更新</h2>
<p>我们可能不时更新本隐私政策。重大变更将通过应用内通知告知您。</p>

<h2>10. 联系我们</h2>
<p>如果您对本隐私政策有任何疑问，请发送邮件至：<strong>mornscience@gmail.com</strong></p>`,
      en: String.raw`<h1>SiteHub Privacy Policy</h1>

<h2>1. Information Collection</h2>
<p>We collect the following types of information:</p>
<ul>
  <li><strong>Account Information</strong>: WeChat nickname, avatar, OpenID</li>
  <li><strong>Usage Data</strong>: Bookmarked websites, access records, search history</li>
  <li><strong>Device Information</strong>: Device model, operating system version</li>
  <li><strong>Location Information</strong>: For localized content recommendations (optional)</li>
</ul>

<h2>2. Information Usage</h2>
<p>We use collected information to:</p>
<ul>
  <li>Provide and improve services</li>
  <li>Personalize user experience</li>
  <li>Technical support and customer service</li>
  <li>Security monitoring and fraud prevention</li>
</ul>

<h2>3. Information Protection</h2>
<p>We use industry-standard security measures to protect your information:</p>
<ul>
  <li>Data encryption in transit and storage</li>
  <li>Access control and authentication</li>
  <li>Regular security audits</li>
  <li>Employee confidentiality training</li>
</ul>

<h2>4. Information Sharing</h2>
<p>We do not sell, rent, or trade your personal information. We only share information in the following cases:</p>
<ul>
  <li>With your explicit consent</li>
  <li>Legal requirements or court orders</li>
  <li>To protect our rights and property</li>
  <li>With trusted third-party service providers (such as payment processors)</li>
</ul>

<h2>5. Data Retention</h2>
<p>We retain your data according to the following principles:</p>
<ul>
  <li>Account information: While account exists</li>
  <li>Usage data: Up to 3 years</li>
  <li>Legal requirements: As required by relevant laws</li>
</ul>

<h2>6. Your Rights</h2>
<p>You have the following rights:</p>
<ul>
  <li>Access and view your personal information</li>
  <li>Correct inaccurate information</li>
  <li>Delete your account and data</li>
  <li>Restrict information processing</li>
  <li>Data portability</li>
</ul>

<h2>7. Cookies and Tracking Technologies</h2>
<p>We use cookies and similar technologies to:</p>
<ul>
  <li>Remember your preferences</li>
  <li>Analyze usage patterns</li>
  <li>Improve user experience</li>
</ul>
<p>You can manage cookie preferences through your browser settings.</p>

<h2>8. Children's Privacy</h2>
<p>Our service is not directed to children under 13. If we discover that we have collected personal information from children, we will delete it immediately.</p>

<h2>9. Privacy Policy Updates</h2>
<p>We may update this privacy policy from time to time. Major changes will be notified to you through in-app notifications.</p>

<h2>10. Contact Us</h2>
<p>If you have any questions about this privacy policy, please email us at <strong>mornscience@gmail.com</strong>.</p>`
    }
  },
  autoRenewalTerms: {
    label: {
      en: "Auto-renewal Terms",
      zh: "自动续费说明"
    },
    content: {
      zh: String.raw`<h1>自动续费说明</h1>

<h2>什么是自动续费？</h2>
<p>自动续费是一种便捷的付费方式，让您的会员服务在到期时自动续期，避免服务中断。</p>

<h2>自动续费规则</h2>
<ul>
  <li><strong>默认开启</strong>：购买会员时自动续费默认开启</li>
  <li><strong>续费时间</strong>：在会员到期前24小时自动扣费</li>
  <li><strong>续费金额</strong>：按原购买价格续费</li>
  <li><strong>续费周期</strong>：按原购买周期续费（月付/年付）</li>
</ul>

<h2>价格说明</h2>
<ul>
  <li><strong>个人会员</strong>：¥19.99/月，¥168/年</li>
  <li><strong>团队会员</strong>：¥299.99/月，¥2520/年</li>
</ul>
<p>年付用户可享受约30%的优惠，我们建议选择年付计划以获得最佳价值。</p>

<h2>如何管理自动续费？</h2>
<p>您可以通过以下步骤管理自动续费：</p>
<ol>
  <li>进入"设置"页面</li>
  <li>点击"账单"标签</li>
  <li>点击"管理订阅"</li>
  <li>选择"取消自动续费"或"重新激活"</li>
</ol>

<h2>取消自动续费</h2>
<p>如果您取消自动续费：</p>
<ul>
  <li>取消后，会员服务将持续到当前周期结束</li>
  <li>取消后不会立即停止服务</li>
  <li>到期后需要手动续费才能继续使用高级功能</li>
  <li>您可以随时重新激活自动续费</li>
</ul>

<h2>续费失败处理</h2>
<p>如果自动续费失败：</p>
<ul>
  <li>服务将在到期后暂停</li>
  <li>系统会发送续费失败通知</li>
  <li>您可在7天内手动续费恢复服务</li>
  <li>超过7天需要重新购买会员</li>
</ul>

<h2>常见问题</h2>
<p><strong>Q: 如何查看下次续费时间？</strong></p>
<p>A: 在"设置"→"账单"中可以看到当前订阅状态和下次续费时间。</p>

<p><strong>Q: 可以更改续费周期吗？</strong></p>
<p>A: 可以。取消当前订阅后，可以重新选择不同的计费周期。</p>

<p><strong>Q: 取消后多久生效？</strong></p>
<p>A: 取消后立即生效，但服务会持续到当前周期结束。</p>

<h2>联系我们</h2>
<p>如果您对自动续费有任何疑问，请发送邮件至：<strong>mornscience@gmail.com</strong></p>`,
      en: String.raw`<h1>Auto Renewal Terms</h1>

<h2>What is Auto Renewal?</h2>
<p>Auto renewal is a convenient payment method that automatically extends your membership service when it expires, preventing service interruption.</p>

<h2>Auto Renewal Rules</h2>
<ul>
  <li><strong>Default On</strong>: Auto renewal is enabled by default when purchasing membership</li>
  <li><strong>Renewal Time</strong>: Automatic charging 24 hours before membership expires</li>
  <li><strong>Renewal Amount</strong>: Charged at the original purchase price</li>
  <li><strong>Renewal Cycle</strong>: Renewed according to the original purchase cycle (monthly/yearly)</li>
</ul>

<h2>Pricing</h2>
<ul>
  <li><strong>Personal Plan</strong>: ¥19.99/month, ¥168/year</li>
  <li><strong>Team Plan</strong>: ¥299.99/month, ¥2520/year</li>
</ul>
<p>Annual subscribers enjoy approximately 30% savings. We recommend choosing the annual plan for the best value.</p>

<h2>How to Manage Auto Renewal?</h2>
<p>You can manage auto renewal through the following steps:</p>
<ol>
  <li>Go to "Settings" page</li>
  <li>Click "Billing" tab</li>
  <li>Click "Manage Subscription"</li>
  <li>Select "Cancel Auto Renewal" or "Reactivate"</li>
</ol>

<h2>Canceling Auto Renewal</h2>
<p>If you cancel auto renewal:</p>
<ul>
  <li>After cancellation, membership service will continue until the current cycle ends</li>
  <li>Service will not stop immediately after cancellation</li>
  <li>Manual renewal is required to continue using advanced features after expiration</li>
  <li>You can reactivate auto renewal anytime</li>
</ul>

<h2>Renewal Failure Handling</h2>
<p>If auto renewal fails:</p>
<ul>
  <li>Service will be suspended after expiration</li>
  <li>The system will send a renewal failure notification</li>
  <li>You can manually renew within 7 days to restore service</li>
  <li>After 7 days, you need to repurchase membership</li>
</ul>

<h2>Frequently Asked Questions</h2>
<p><strong>Q: How to check the next renewal time?</strong></p>
<p>A: Go to "Settings" → "Billing" to see your current subscription status and next renewal time.</p>

<p><strong>Q: Can I change the renewal cycle?</strong></p>
<p>A: Yes. After canceling your current subscription, you can choose a different billing cycle.</p>

<p><strong>Q: When does cancellation take effect?</strong></p>
<p>A: Cancellation takes effect immediately, but service will continue until the current cycle ends.</p>

<h2>Contact Us</h2>
<p>If you have any questions about auto renewal, please email us at <strong>mornscience@gmail.com</strong>.</p>`
    }
  },
  cancellationGuide: {
    label: {
      en: "Cancellation Guide",
      zh: "取消订阅指南"
    },
    content: {
      zh: String.raw`<h1>取消订阅指南</h1>

<h2>取消方式</h2>
<p>您可以通过以下方式取消订阅：</p>

<h3>方法一：通过应用内设置</h3>
<ol>
  <li>打开SiteHub应用</li>
  <li>点击右下角"设置"</li>
  <li>选择"账单"标签</li>
  <li>点击"管理订阅"</li>
  <li>选择"取消自动续费"</li>
  <li>确认取消操作</li>
</ol>

<h3>方法二：通过微信支付</h3>
<ol>
  <li>打开微信</li>
  <li>点击"我" → "支付"</li>
  <li>点击右上角"..."</li>
  <li>选择"自动扣费"</li>
  <li>找到SiteHub订阅</li>
  <li>点击"关闭服务"</li>
</ol>

<h2>取消后的影响</h2>
<ul>
  <li><strong>服务继续</strong>：您的会员服务将继续到当前计费周期结束</li>
  <li><strong>功能保留</strong>：所有高级功能在剩余时间内正常使用</li>
  <li><strong>数据保留</strong>：您的收藏网站和个人数据将被保留</li>
  <li><strong>降级处理</strong>：到期后自动降级为免费用户</li>
</ul>

<h2>免费用户限制</h2>
<p>取消订阅后，到期时将受到以下限制：</p>
<ul>
  <li>收藏网站数量限制（最多50个）</li>
  <li>无法使用高级搜索功能</li>
  <li>无法使用自定义分类</li>
  <li>无法导出数据</li>
  <li>广告显示</li>
</ul>

<h2>重新订阅</h2>
<p>如果您改变主意，可以随时重新订阅：</p>
<ol>
  <li>进入"设置" → "账单"</li>
  <li>点击"升级Pro会员"</li>
  <li>选择订阅计划</li>
  <li>完成支付</li>
</ol>

<h2>常见问题</h2>
<p><strong>Q: 取消后多久生效？</strong></p>
<p>A: 取消立即生效，但服务会持续到当前周期结束。</p>

<p><strong>Q: 可以暂停订阅吗？</strong></p>
<p>A: 目前不支持暂停功能，但您可以取消后重新订阅。</p>

<p><strong>Q: 取消后可以退款吗？</strong></p>
<p>A: 根据我们的退款政策，在特定条件下可以申请退款。</p>

<p><strong>Q: 如何查看订阅状态？</strong></p>
<p>A: 在"设置" → "账单"中可以查看详细的订阅信息。</p>

<h2>数据迁移</h2>
<p>如果您决定不再使用SiteHub，您可以：</p>
<ul>
  <li>导出您的收藏网站数据</li>
  <li>下载个人资料备份</li>
  <li>联系客服协助数据迁移</li>
</ul>

<h2>联系我们</h2>
<p>如果您在取消过程中遇到任何问题，请发送邮件至：<strong>mornscience@gmail.com</strong></p>`,
      en: String.raw`<h1>Cancellation Guide</h1>

<h2>Cancellation Methods</h2>
<p>You can cancel your subscription through the following methods:</p>

<h3>Method 1: Through In-App Settings</h3>
<ol>
  <li>Open the SiteHub app</li>
  <li>Click "Settings" in the bottom right</li>
  <li>Select "Billing" tab</li>
  <li>Click "Manage Subscription"</li>
  <li>Select "Cancel Auto Renewal"</li>
  <li>Confirm the cancellation</li>
</ol>

<h3>Method 2: Through WeChat Pay</h3>
<ol>
  <li>Open WeChat</li>
  <li>Click "Me" → "Pay"</li>
  <li>Click "..." in the top right</li>
  <li>Select "Auto Debit"</li>
  <li>Find SiteHub subscription</li>
  <li>Click "Close Service"</li>
</ol>

<h2>Impact After Cancellation</h2>
<ul>
  <li><strong>Service Continues</strong>: Your membership service will continue until the current billing cycle ends</li>
  <li><strong>Features Retained</strong>: All premium features work normally during the remaining time</li>
  <li><strong>Data Retained</strong>: Your bookmarked websites and personal data will be retained</li>
  <li><strong>Downgrade</strong>: Automatically downgraded to free user after expiration</li>
</ul>

<h2>Free User Limitations</h2>
<p>After canceling subscription, you will face the following limitations upon expiration:</p>
<ul>
  <li>Limited bookmarked websites (max 50)</li>
  <li>No access to advanced search features</li>
  <li>No custom categorization</li>
  <li>No data export</li>
  <li>Ads displayed</li>
</ul>

<h2>Resubscribe</h2>
<p>If you change your mind, you can resubscribe anytime:</p>
<ol>
  <li>Go to "Settings" → "Billing"</li>
  <li>Click "Upgrade to Pro"</li>
  <li>Select subscription plan</li>
  <li>Complete payment</li>
</ol>

<h2>Frequently Asked Questions</h2>
<p><strong>Q: When does cancellation take effect?</strong></p>
<p>A: Cancellation takes effect immediately, but service continues until the current cycle ends.</p>

<p><strong>Q: Can I pause my subscription?</strong></p>
<p>A: Pause functionality is not currently supported, but you can cancel and resubscribe.</p>

<p><strong>Q: Can I get a refund after cancellation?</strong></p>
<p>A: According to our refund policy, refunds can be requested under specific conditions.</p>

<p><strong>Q: How to check subscription status?</strong></p>
<p>A: Go to "Settings" → "Billing" to view detailed subscription information.</p>

<h2>Data Migration</h2>
<p>If you decide to stop using SiteHub, you can:</p>
<ul>
  <li>Export your bookmarked website data</li>
  <li>Download personal profile backup</li>
  <li>Contact customer service for data migration assistance</li>
</ul>

<h2>Contact Us</h2>
<p>If you encounter any issues during cancellation, please email us at <strong>mornscience@gmail.com</strong>.</p>`
    }
  },
  refundPolicy: {
    label: {
      en: "Refund Policy",
      zh: "退款政策"
    },
    content: {
      zh: String.raw`<h1>退款政策</h1>

<h2>退款条件</h2>
<p>在以下情况下，您可以申请退款：</p>
<ul>
  <li><strong>自动续费</strong>：首次自动续费后7天内</li>
  <li><strong>重复扣费</strong>：系统错误导致的重复扣费</li>
  <li><strong>服务故障</strong>：连续7天无法正常使用服务</li>
  <li><strong>功能不符</strong>：实际功能与宣传严重不符</li>
</ul>

<h2>退款金额计算</h2>
<ul>
  <li><strong>未使用期间</strong>：按未使用的天数比例退款</li>
  <li><strong>手续费</strong>：扣除第三方支付平台手续费</li>
  <li><strong>最低退款</strong>：单次退款金额不低于¥1.00</li>
</ul>

<h2>退款流程</h2>
<ol>
  <li><strong>提交申请</strong>：发送邮件至 mornscience@gmail.com 提交退款申请</li>
  <li><strong>审核处理</strong>：我们将在1-3个工作日内审核</li>
  <li><strong>退款确认</strong>：审核通过后发送退款确认邮件</li>
  <li><strong>资金退回</strong>：3-7个工作日内原路退回</li>
</ol>

<h2>申请材料</h2>
<p>申请退款时，请提供：</p>
<ul>
  <li>用户账户信息</li>
  <li>订单号或交易流水号</li>
  <li>退款原因说明</li>
  <li>相关证据材料（如截图）</li>
</ul>

<h2>不退款情况</h2>
<p>以下情况不予退款：</p>
<ul>
  <li>超过退款时限的申请</li>
  <li>已充分使用服务功能</li>
  <li>因用户个人原因导致的无法使用</li>
  <li>违反服务条款被终止服务</li>
  <li>恶意退款申请</li>
</ul>

<h2>退款方式</h2>
<ul>
  <li><strong>原路退回</strong>：退款将原路返回到您的支付账户</li>
  <li><strong>到账时间</strong>：微信支付1-3个工作日，其他方式3-7个工作日</li>
  <li><strong>退款通知</strong>：退款完成后会发送通知</li>
</ul>

<h2>争议处理</h2>
<p>如果您对退款处理结果有异议：</p>
<ul>
  <li>可以申请重新审核</li>
  <li>提供补充证据材料</li>
  <li>通过客服渠道沟通解决</li>
  <li>必要时可向相关监管部门投诉</li>
</ul>

<h2>联系方式</h2>
<p>退款相关问题请发送邮件至：<strong>mornscience@gmail.com</strong></p>

<h2>政策更新</h2>
<p>本退款政策可能会不时更新。重大变更将通过应用内通知告知用户。继续使用服务即表示您接受更新后的政策。</p>`,
      en: String.raw`<h1>Refund Policy</h1>

<h2>Refund Conditions</h2>
<p>You can apply for a refund under the following circumstances:</p>
<ul>
  <li><strong>Auto Renewal</strong>: Within 7 days of first auto renewal</li>
  <li><strong>Duplicate Charges</strong>: System errors causing duplicate charges</li>
  <li><strong>Service Failure</strong>: Unable to use service normally for 7 consecutive days</li>
  <li><strong>Feature Mismatch</strong>: Actual features significantly differ from advertising</li>
</ul>

<h2>Refund Amount Calculation</h2>
<ul>
  <li><strong>Unused Period</strong>: Refund based on proportion of unused days</li>
  <li><strong>Processing Fee</strong>: Third-party payment platform fees deducted</li>
  <li><strong>Minimum Refund</strong>: Single refund amount not less than ¥1.00</li>
</ul>

<h2>Refund Process</h2>
<ol>
  <li><strong>Submit Application</strong>: Send an email to mornscience@gmail.com to submit your refund request</li>
  <li><strong>Review Process</strong>: We will review within 1-3 business days</li>
  <li><strong>Refund Confirmation</strong>: Send refund confirmation email after approval</li>
  <li><strong>Fund Return</strong>: Original payment method refund within 3-7 business days</li>
</ol>

<h2>Required Materials</h2>
<p>When applying for a refund, please provide:</p>
<ul>
  <li>User account information</li>
  <li>Order number or transaction ID</li>
  <li>Refund reason explanation</li>
  <li>Relevant evidence materials (such as screenshots)</li>
</ul>

<h2>Non-Refundable Cases</h2>
<p>The following cases are not eligible for refunds:</p>
<ul>
  <li>Applications beyond the refund time limit</li>
  <li>Having fully used the service features</li>
  <li>Unable to use due to personal reasons</li>
  <li>Service terminated due to terms of service violations</li>
  <li>Malicious refund applications</li>
</ul>

<h2>Refund Methods</h2>
<ul>
  <li><strong>Original Payment Method</strong>: Refunds will be returned to your original payment account</li>
  <li><strong>Processing Time</strong>: WeChat Pay 1-3 business days, other methods 3-7 business days</li>
  <li><strong>Refund Notification</strong>: Notification sent after refund completion</li>
</ul>

<h2>Dispute Resolution</h2>
<p>If you disagree with the refund processing result:</p>
<ul>
  <li>You can apply for re-review</li>
  <li>Provide additional evidence materials</li>
  <li>Resolve through customer service channels</li>
  <li>File complaints with relevant regulatory departments if necessary</li>
</ul>

<h2>Contact Information</h2>
<p>For refund-related questions, please email us at <strong>mornscience@gmail.com</strong>.</p>

<h2>Policy Updates</h2>
<p>This refund policy may be updated from time to time. Major changes will be notified to users through in-app notifications. Continued use of the service indicates your acceptance of the updated policy.</p>`
    }
  }
}

// formatSubscription enriches raw subscription data for UI // formatSubscription 将原始订阅数据加工为 UI 结构
function formatSubscription(raw: RawSubscription, locale: "en" | "zh"): FormattedSubscription {
  const meta = membershipMeta[raw.plan_type]
  const normalizedCycle = raw.billing_cycle === "yearly" ? "yearly" : "monthly"
  const baseCurrency = meta.defaultCurrency[locale]
  const defaultAmount = meta.defaultPrice[normalizedCycle]

  const expiryDate = raw.expire_time ? new Date(raw.expire_time) : null
  const startDate = raw.start_time ? new Date(raw.start_time) : null
  const now = new Date()
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "--"

  const formattedStart = startDate
    ? startDate.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "--"

  return {
    ...raw,
    billing_cycle: raw.billing_cycle,
    normalizedCycle,
    displayPlan: meta.label[locale],
    displayTier: meta.tier[locale],
    summary: meta.summary[locale],
    features: meta.features[locale],
    formattedExpiry,
    formattedStart,
    daysLeft: daysLeft > 0 ? daysLeft : 0,
    displayAmount: defaultAmount,
    displayCurrency: baseCurrency,
    upgradeAvailable: meta.upgradeAvailable
  }
}

// centsToCurrency converts integer cents to human readable amount // centsToCurrency 将以分为单位的金额转换为易读字符串
function centsToCurrency(value: number, currency: string, locale: "en" | "zh") {
  const amount = value / 100
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2
  }).format(amount)
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, supabaseUser, loading: authLoading, signOut } = useAuth()
  const { languageCode } = useGeo()
  const { language: globalLanguage, setLanguage: updateLanguageContext, isAuto: globalLanguageAuto } = useLanguage()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState("account")
  const [subscription, setSubscription] = useState<FormattedSubscription | null>(null)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loadingSubscription, setLoadingSubscription] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "zh">("en")
  const [isAutoLanguage, setIsAutoLanguage] = useState(true)
  const [legalDialogOpen, setLegalDialogOpen] = useState(false)
  const [selectedLegal, setSelectedLegal] = useState<LegalDocumentKey | null>(null)

  const isAuthenticated = user?.type === "authenticated" && !!supabaseUser
  const userEmail = supabaseUser?.email ?? user?.email ?? ""

  // determineLocale keeps UI language consistent // determineLocale 负责保持界面语言一致
  useEffect(() => {
    const stored = wxStorage.get<string>("sitehub_language")
    if (stored === "zh" || stored === "en") {
      setCurrentLanguage(stored)
      setIsAutoLanguage(false)
      return
    }
    const fallback = languageCode === "zh" ? "zh" : "en"
    setCurrentLanguage(fallback)
    setIsAutoLanguage(true)
  }, [languageCode])

  useEffect(() => {
    setCurrentLanguage(globalLanguage)
    setIsAutoLanguage(globalLanguageAuto)
  }, [globalLanguage, globalLanguageAuto])

  // load account data once auth ready // 等待鉴权完成后加载账户数据
  useEffect(() => {
    if (authLoading) {
      return
    }
    if (!isAuthenticated || !userEmail) {
      setSubscription(null)
      setTransactions([])
      return
    }
    loadSubscriptionData(userEmail, currentLanguage)
    loadTransactions(userEmail)
  }, [authLoading, isAuthenticated, userEmail, currentLanguage])

  const loadSubscriptionData = async (email: string, locale: "en" | "zh") => {
    setLoadingSubscription(true)
    try {
      const { data, error } = await supabase
        .from("web_subscriptions")
        .select("*")
        .eq("user_email", email)
        .single()

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Failed to load subscription:", error)
          toast.error("Failed to load subscription data")
        }
        setSubscription(null)
        return
      }

      if (!data) {
        setSubscription(null)
        return
      }

      setSubscription(formatSubscription(data as RawSubscription, locale))
    } catch (error) {
      console.error("Subscription query error:", error)
      setSubscription(null)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const loadTransactions = async (email: string) => {
    setLoadingTransactions(true)
    try {
      const { data, error } = await supabase
        .from("web_payment_transactions")
        .select("id, plan_type, billing_cycle, payment_method, payment_status, gross_amount, currency, payment_time, created_at")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Failed to load billing history:", error)
        toast.error("Failed to load billing history")
        setTransactions([])
        return
      }

      setTransactions((data as PaymentTransaction[]) || [])
    } catch (error) {
      console.error("Billing history error:", error)
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    }
  }

  const handleUpgrade = () => {
    wxPayment.redirectToPaymentPortal()
  }

  const handleManageBilling = () => {
    toast.info("Opening billing management...")
    wxPayment.redirectToPaymentPortal()
  }

  const handleLegalClick = (key: LegalDocumentKey) => {
    setSelectedLegal(key)
    setLegalDialogOpen(true)
  }

  const handleLanguageChange = (lang: "auto" | "en" | "zh") => {
    if (lang === "auto") {
      updateLanguageContext("auto")
      const fallback = languageCode === "zh" ? "zh" : "en"
      setCurrentLanguage(fallback)
      setIsAutoLanguage(true)
      toast.success("Language switched to auto detection 自动检测已开启")
    } else {
      updateLanguageContext(lang)
      setCurrentLanguage(lang)
      setIsAutoLanguage(false)
      toast.success(lang === "zh" ? "语言已切换为中文" : "Language switched to English")
    }

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }, 600)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("mornscience@gmail.com")
      toast.success("Email copied to clipboard 邮箱已复制")
    } catch (error) {
      console.error("Clipboard error:", error)
      toast.error("Unable to copy email 复制失败")
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return "--"
    }
    const date = new Date(dateString)
    return date.toLocaleDateString(currentLanguage === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getDaysRemaining = (expireTime?: string) => {
    if (!expireTime) {
      return 0
    }
    const now = new Date()
    const expiry = new Date(expireTime)
    const diff = expiry.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const localeForFormat = useMemo(() => (currentLanguage === "zh" ? "zh" : "en"), [currentLanguage])
  const legalList = useMemo(
    () =>
      (["termsOfService", "privacyPolicy", "autoRenewalTerms", "cancellationGuide", "refundPolicy"] as LegalDocumentKey[]).map(
        (key) => ({
          key,
          label: legalDocuments[key].label[currentLanguage]
        })
      ),
    [currentLanguage]
  )
  const isPro = subscription?.status === "active"
  const activeLegalDoc = selectedLegal ? legalDocuments[selectedLegal] : null
  const legalDialogTitle = activeLegalDoc ? activeLegalDoc.label[currentLanguage] : ""
  const legalDialogContent = activeLegalDoc ? activeLegalDoc.content[currentLanguage] : ""

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading settings... 设置加载中</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-4">
        <Card className="w-full max-w-md bg-slate-800/60 border-slate-700">
          <CardHeader className="text-center space-y-3">
            <User className="w-16 h-16 mx-auto text-slate-400" />
            <CardTitle className="text-2xl text-white">Login Required</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Sign in to access account settings 登录后即可管理账号
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Homepage 返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentLanguage === "zh" ? "设置中心" : "Settings"}
          </h1>
          <p className="text-slate-400">
            {currentLanguage === "zh"
              ? "管理账号、订阅、语言偏好和法律条款"
              : "Manage account, billing, language, and legal preferences"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="account" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              {currentLanguage === "zh" ? "账号" : "Account"}
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              {currentLanguage === "zh" ? "账单" : "Billing"}
            </TabsTrigger>
            <TabsTrigger value="language" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Globe className="w-4 h-4 mr-2" />
              {currentLanguage === "zh" ? "语言" : "Language"}
            </TabsTrigger>
            <TabsTrigger value="legal" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              {currentLanguage === "zh" ? "法律" : "Legal"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5" />
                  {currentLanguage === "zh" ? "个人信息" : "Profile Information"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={(supabaseUser?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                      {userEmail?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 w-full space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{currentLanguage === "zh" ? "邮箱" : "Email"}</span>
                      <span className="text-white font-medium">{userEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{currentLanguage === "zh" ? "用户 ID" : "User ID"}</span>
                      <span className="font-mono text-slate-300">
                        {supabaseUser?.id?.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{currentLanguage === "zh" ? "注册时间" : "Registered"}</span>
                      <span className="text-slate-300">
                        {supabaseUser?.created_at ? formatDate(supabaseUser.created_at) : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Crown className="w-5 h-5" />
                  {currentLanguage === "zh" ? "会员权益" : "Membership Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : isPro && subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        {currentLanguage === "zh" ? "当前套餐" : "Current Plan"}
                      </span>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        {subscription.displayPlan}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{currentLanguage === "zh" ? "计费周期" : "Billing Cycle"}</span>
                      <span>
                        {subscription.normalizedCycle === "monthly"
                          ? currentLanguage === "zh"
                            ? "月付"
                            : "Monthly"
                          : currentLanguage === "zh"
                            ? "年付"
                            : "Yearly"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{currentLanguage === "zh" ? "到期时间" : "Expires"}</span>
                      <div className="text-right">
                        <div>{subscription.formattedExpiry}</div>
                        <div className="text-xs text-slate-500">
                          {subscription.daysLeft}
                          {currentLanguage === "zh" ? " 天剩余" : " days remaining"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{currentLanguage === "zh" ? "自动续费" : "Auto-renewal"}</span>
                      <Badge variant={subscription.auto_renew ? "default" : "secondary"}>
                        {subscription.auto_renew
                          ? currentLanguage === "zh"
                            ? "已开启"
                            : "Enabled"
                          : currentLanguage === "zh"
                            ? "已关闭"
                            : "Disabled"}
                      </Badge>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        {subscription.summary}
                      </h4>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {subscription.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-blue-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={() => setActiveTab("billing")}
                      variant="outline"
                      className="w-full border-slate-600 hover:bg-slate-700"
                    >
                      {currentLanguage === "zh" ? "查看账单" : "View Billing"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="text-slate-300">
                      {currentLanguage === "zh" ? "当前为免费版" : "You are on the Free plan"}
                    </div>
                    <p className="text-xs text-slate-500">
                      {currentLanguage === "zh"
                        ? "限量收藏与自定义站点，升级即可解锁全部权益"
                        : "Limited collections and custom sites. Upgrade to unlock full benefits."}
                    </p>
                    <Button
                      onClick={handleUpgrade}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {currentLanguage === "zh" ? "立即升级 Pro" : "Upgrade to Pro"}
                      <Crown className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700">
              <CardContent className="pt-6">
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  {currentLanguage === "zh" ? "退出登录" : "Sign Out"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 mt-6">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="w-5 h-5" />
                  {currentLanguage === "zh" ? "订阅状态" : "Subscription Status"}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {currentLanguage === "zh"
                    ? "了解你的会员状态、下次扣费与自动续费情况"
                    : "Keep track of your membership, next billing, and auto-renewal"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-10 w-10 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/30 rounded-xl border border-blue-800/30">
                      <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-yellow-400" />
                        <div>
                          <div className="font-semibold text-white">{subscription.displayPlan}</div>
                          <div className="text-xs text-slate-400 uppercase tracking-wide">
                            {subscription.payment_method}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {subscription.displayCurrency === "CNY" ? "¥" : "$"}
                          {subscription.displayAmount}
                        </div>
                        <div className="text-xs text-slate-400">
                          /{subscription.normalizedCycle === "monthly"
                            ? currentLanguage === "zh"
                              ? "月"
                              : "month"
                            : currentLanguage === "zh"
                              ? "年"
                              : "year"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>{currentLanguage === "zh" ? "下次扣费" : "Next billing"}</span>
                        <span>{formatDate(subscription.next_billing_date || subscription.expire_time)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>{currentLanguage === "zh" ? "自动续费" : "Auto-renewal"}</span>
                        <Badge variant={subscription.auto_renew ? "default" : "secondary"}>
                          {subscription.auto_renew
                            ? currentLanguage === "zh"
                              ? "已开启"
                              : "Enabled"
                            : currentLanguage === "zh"
                              ? "已关闭"
                              : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 pt-2">
                      {subscription.upgradeAvailable && (
                        <Button
                          onClick={handleUpgrade}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                        >
                          {currentLanguage === "zh" ? "升级到 Team" : "Upgrade to Team"}
                        </Button>
                      )}
                      <Button
                        onClick={handleManageBilling}
                        variant="outline"
                        className="flex-1 border-slate-600 hover:bg-slate-700"
                      >
                        {currentLanguage === "zh" ? "管理订阅" : "Manage Billing"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <CreditCard className="w-16 h-16 mx-auto text-slate-600" />
                    <p className="text-slate-300">
                      {currentLanguage === "zh" ? "没有找到订阅记录" : "No active subscription"}
                    </p>
                    <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
                      {currentLanguage === "zh" ? "立即订阅" : "Subscribe Now"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {currentLanguage === "zh" ? "账单历史" : "Billing History"}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {currentLanguage === "zh"
                    ? "最近 10 笔支付记录，确保与小程序账单一致"
                    : "Latest 10 transactions, matching the mini program billing view"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-700/60"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">
                            {tx.plan_type === "pro"
                              ? currentLanguage === "zh"
                                ? "Pro 套餐"
                                : "Pro Plan"
                              : currentLanguage === "zh"
                                ? "Team 套餐"
                                : "Team Plan"}
                            {" · "}
                            {tx.billing_cycle === "monthly"
                              ? currentLanguage === "zh"
                                ? "月付"
                                : "Monthly"
                              : tx.billing_cycle === "yearly"
                                ? currentLanguage === "zh"
                                  ? "年付"
                                  : "Yearly"
                                : currentLanguage === "zh"
                                  ? "一次性"
                                  : "One-off"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(tx.payment_time || tx.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-400 text-sm">
                            {centsToCurrency(tx.gross_amount, tx.currency || "USD", localeForFormat)}
                          </div>
                          <Badge
                            variant={tx.payment_status === "completed" ? "default" : "secondary"}
                            className="text-xs uppercase"
                          >
                            {tx.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">
                    {currentLanguage === "zh" ? "暂无账单记录" : "No billing history yet"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-amber-900/20 border-amber-700/40">
              <CardHeader>
                <CardTitle className="text-amber-400">
                  {currentLanguage === "zh" ? "重要提示" : "Important Notice"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-200 space-y-2">
                <p>• {currentLanguage === "zh" ? "默认开启自动续费以避免服务中断" : "Auto-renewal is on by default to prevent service interruptions"}</p>
                <p>• {currentLanguage === "zh" ? "可随时通过“管理订阅”关闭续费" : "You can cancel anytime in Manage Billing"}</p>
                <p>• {currentLanguage === "zh" ? "取消后服务会持续到当前周期结束" : "Service remains active until the current period ends"}</p>
                <p>• {currentLanguage === "zh" ? "需要帮助请联系客户支持" : "Contact support if you run into issues"}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language" className="space-y-6 mt-6">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="w-5 h-5" />
                  {currentLanguage === "zh" ? "语言偏好" : "Language Preferences"}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {currentLanguage === "zh"
                    ? "同步小程序逻辑，支持自动检测与手动切换"
                    : "Keeps the mini program behaviour with auto detect and manual override"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 bg-slate-900/40 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      {currentLanguage === "zh" ? "当前语言" : "Current Language"}
                    </span>
                    <span className="text-sm text-white">
                      {currentLanguage === "zh" ? "中文 🇨🇳" : "English 🇺🇸"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{currentLanguage === "zh" ? "检测方式" : "Detection Method"}</span>
                    <span>{isAutoLanguage
                      ? currentLanguage === "zh"
                        ? "自动检测（IP）"
                        : "Auto detected (IP)"
                      : currentLanguage === "zh"
                        ? "手动选择"
                        : "Manual selection"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleLanguageChange("auto")}
                    className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      isAutoLanguage
                        ? "border-blue-600 bg-blue-900/20"
                        : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isAutoLanguage ? "border-blue-500 bg-blue-500" : "border-slate-600"
                      }`}
                    >
                      {isAutoLanguage && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">
                        {currentLanguage === "zh" ? "自动检测（推荐）" : "Auto detect (recommended)"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {currentLanguage === "zh"
                          ? "首次访问按照 IP 自动匹配语言"
                          : "Selects language using IP on first visit"}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleLanguageChange("zh")}
                    className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      !isAutoLanguage && currentLanguage === "zh"
                        ? "border-blue-600 bg-blue-900/20"
                        : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        !isAutoLanguage && currentLanguage === "zh"
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-600"
                      }`}
                    >
                      {!isAutoLanguage && currentLanguage === "zh" && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">中文（手动）</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {currentLanguage === "zh"
                          ? "始终使用中文界面"
                          : "Always show the Chinese interface"}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      !isAutoLanguage && currentLanguage === "en"
                        ? "border-blue-600 bg-blue-900/20"
                        : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        !isAutoLanguage && currentLanguage === "en"
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-600"
                      }`}
                    >
                      {!isAutoLanguage && currentLanguage === "en" && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">English (Manual)</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Always use the English interface
                      </div>
                    </div>
                  </button>
                </div>

                <Separator className="bg-slate-700" />
                <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-800/30 text-xs text-slate-300 space-y-1">
                  <p>• {currentLanguage === "zh" ? "首次访问会根据 IP 自动匹配语言" : "First visit auto detects language using IP"}</p>
                  <p>• {currentLanguage === "zh" ? "手动选择将保存到浏览器" : "Manual selection is saved to your browser"}</p>
                  <p>• {currentLanguage === "zh" ? "手动选择会覆盖自动检测结果" : "Manual selection overrides auto detection"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6 mt-6">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5" />
                  {currentLanguage === "zh" ? "法律与政策" : "Legal & Policies"}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {currentLanguage === "zh"
                    ? "与小程序同款的协议内容，适配官网分页"
                    : "Same agreements as the mini program, adapted for the web"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b border-slate-800 divide-y divide-slate-800">
                  {legalList.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleLegalClick(item.key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-900/40 transition-colors"
                    >
                      <span className="text-white text-sm font-medium">{item.label}</span>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="w-5 h-5" />
                  {currentLanguage === "zh" ? "联系我们" : "Contact Us"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-slate-300">
                  <div>
                    <div className="text-xs text-slate-500 uppercase mb-1">
                      {currentLanguage === "zh" ? "客服邮箱" : "Support Email"}
                    </div>
                    <div className="font-mono text-white">mornscience@gmail.com</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {currentLanguage === "zh"
                        ? "工作日 9:00-18:00"
                        : "Monday - Friday, 9:00 AM - 6:00 PM"}
                    </span>
                  </div>
                </div>
                <Button onClick={copyEmail} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Mail className="w-4 h-4 mr-2" />
                  {currentLanguage === "zh" ? "复制邮箱" : "Copy Email Address"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Dialog
          open={legalDialogOpen}
          onOpenChange={(open) => {
            setLegalDialogOpen(open)
            if (!open) {
              setSelectedLegal(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-slate-900 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>{legalDialogTitle || (currentLanguage === "zh" ? "法律条款" : "Legal Document")}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="mt-4 h-[55vh] pr-4">
              <div
                className="text-sm leading-relaxed text-slate-200 space-y-4"
                // Render trusted legal HTML copied from the mini program // 渲染从小程序同步的法律正文
                dangerouslySetInnerHTML={{ __html: legalDialogContent }}
              />
            </ScrollArea>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setLegalDialogOpen(false)}>
                {currentLanguage === "zh" ? "我知道了" : "I Understand"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
