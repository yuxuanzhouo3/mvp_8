import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * 欧洲地区屏蔽页面
 *
 * 原因：GDPR 合规要求
 * 显示：服务暂不支持欧洲地区
 */

export default function EuropeBlockedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center border border-white/20">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-4xl font-bold text-white">S</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Service Not Available in Europe
        </h1>

        {/* Description */}
        <p className="text-lg text-white/80 mb-6 leading-relaxed">
          Due to regulatory requirements (GDPR), we are currently unable to offer our services in European countries.
        </p>

        <p className="text-white/70 mb-8">
          We apologize for any inconvenience this may cause. If you have any questions or would like to discuss business opportunities, please feel free to contact us.
        </p>

        {/* Contact Button */}
        <Button
          onClick={() => window.open('mailto:mornscience@gmail.com?subject=Inquiry from Europe', '_blank')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl"
        >
          <Mail className="w-5 h-5 mr-2" />
          Contact Us
        </Button>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-sm text-white/60">
            SiteHub - Your gateway to 300+ curated websites
          </p>
          <p className="text-sm text-white/50 mt-2">
            We are working on expanding our services to comply with European regulations
          </p>
        </div>
      </div>
    </div>
  )
}
