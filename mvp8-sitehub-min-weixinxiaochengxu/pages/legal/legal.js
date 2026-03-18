// pages/legal/legal.js
const app = getApp()

Page({
  data: {
    type: '', // termsOfService, privacyPolicy, autoRenewalTerms, cancellationGuide, refundPolicy
    title: '',
    content: '',
    currentLang: 'zh',
    uiText: {
      agree: '我知道了'
    }
  },

  onLoad(options) {
    const { type } = options
    this.setData({ type })
    this.initLanguage()
    this.loadContent()
  },

  initLanguage() {
    const app = getApp()
    const currentLang = app.globalData.currentLang || 'zh'
    this.setData({ currentLang })
    this.updateUIText(currentLang)
  },

  updateUIText(lang) {
    this.setData({
      uiText: {
        agree: lang === 'zh' ? '我知道了' : 'I Understand'
      }
    })
  },

  loadContent() {
    const content = this.getContentByType(this.data.type, this.data.currentLang)
    this.setData({
      title: content.title,
      content: content.content
    })
  },

  getContentByType(type, lang = 'zh') {
    const contents = {
      termsOfService: {
        title: lang === 'zh' ? '服务条款' : 'Terms of Service',
        content: this.getTermsOfServiceContent(lang)
      },
      privacyPolicy: {
        title: lang === 'zh' ? '隐私政策' : 'Privacy Policy',
        content: this.getPrivacyPolicyContent(lang)
      },
      autoRenewalTerms: {
        title: lang === 'zh' ? '自动续费说明' : 'Auto Renewal Terms',
        content: this.getAutoRenewalContent(lang)
      },
      cancellationGuide: {
        title: lang === 'zh' ? '取消订阅指南' : 'Cancellation Guide',
        content: this.getCancellationGuideContent(lang)
      },
      refundPolicy: {
        title: lang === 'zh' ? '退款政策' : 'Refund Policy',
        content: this.getRefundPolicyContent(lang)
      }
    }
    return contents[type] || { title: '', content: '' }
  },

  getTermsOfServiceContent(lang) {
    if (lang === 'zh') {
      return `<h1>SiteHub 服务条款</h1>

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
<p>我们可能不时更新本条款。重大变更将通过应用内通知或邮件告知用户。继续使用服务即表示您接受更新后的条款。</p>`
    } else {
      return `<h1>SiteHub Terms of Service</h1>

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

  getPrivacyPolicyContent(lang) {
    if (lang === 'zh') {
      return `<h1>SiteHub 隐私政策</h1>

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
<p>如果您对本隐私政策有任何疑问，请发送邮件至：<strong>mornscience@gmail.com</strong></p>`
    } else {
      return `<h1>SiteHub Privacy Policy</h1>

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

  getAutoRenewalContent(lang) {
    if (lang === 'zh') {
      return `<h1>自动续费说明</h1>

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
<p>如果您对自动续费有任何疑问，请发送邮件至：<strong>mornscience@gmail.com</strong></p>`
    } else {
      return `<h1>Auto Renewal Terms</h1>

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

  getCancellationGuideContent(lang) {
    if (lang === 'zh') {
      return `<h1>取消订阅指南</h1>

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
<p>如果您在取消过程中遇到任何问题，请发送邮件至：<strong>mornscience@gmail.com</strong></p>`
    } else {
      return `<h1>Cancellation Guide</h1>

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

  getRefundPolicyContent(lang) {
    if (lang === 'zh') {
      return `<h1>退款政策</h1>

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
<p>本退款政策可能会不时更新。重大变更将通过应用内通知告知用户。继续使用服务即表示您接受更新后的政策。</p>`
    } else {
      return `<h1>Refund Policy</h1>

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
  },

  onBack() {
    wx.navigateBack()
  },

  onAgree() {
    wx.navigateBack()
  }
})
