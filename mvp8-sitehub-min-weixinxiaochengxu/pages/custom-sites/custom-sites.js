// pages/custom-sites/custom-sites.js - 自定义网站管理页面

Page({
  /**
   * 页面的初始数据
   */
  data: {
    customSites: [],
    loading: false,
    showAddModal: false,
    editingSite: null,
    
    // 添加/编辑表单
    formData: {
      name: '',
      url: '',
      logo: '🌐',
      description: ''
    },
    
    // UI文本
    uiText: {
      pageTitle: '自定义网站',
      addSite: '添加网站',
      editSite: '编辑网站',
      siteName: '网站名称',
      siteUrl: '网站地址',
      siteLogo: '网站图标',
      siteDescription: '网站描述',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirmDelete: '确认删除',
      deleteConfirm: '确定要删除这个网站吗？',
      emptyTip: '还没有添加自定义网站',
      addFirst: '点击右上角 + 号添加第一个网站',
      nameRequired: '请输入网站名称',
      urlRequired: '请输入网站地址',
      urlInvalid: '请输入有效的网址',
      saveSuccess: '保存成功',
      deleteSuccess: '删除成功',
      saveError: '保存失败',
      deleteError: '删除失败'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadCustomSites()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新加载数据
    this.loadCustomSites()
  },

  // 加载自定义网站
  async loadCustomSites() {
    try {
      console.log('📥 [CustomSites] 开始加载自定义网站...')
      const api = require('../../utils/api.js')
      const customSites = await api.loadCustomSites()
      
      console.log(`✅ [CustomSites] 加载完成: ${customSites.length}个自定义网站`)
      this.setData({ customSites })
    } catch (error) {
      console.error('❌ [CustomSites] 加载自定义网站失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 显示添加弹窗
  showAddModal() {
    this.setData({
      showAddModal: true,
      editingSite: null,
      formData: {
        name: '',
        url: '',
        logo: '🌐',
        description: ''
      }
    })
  },

  // 显示编辑弹窗
  showEditModal(e) {
    const siteId = e.currentTarget.dataset.id
    const site = this.data.customSites.find(s => s.id === siteId)
    
    if (!site) return
    
    this.setData({
      showAddModal: true,
      editingSite: site,
      formData: {
        name: site.name,
        url: site.url,
        logo: site.logo || '🌐',
        description: site.description || ''
      }
    })
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showAddModal: false,
      editingSite: null,
      formData: {
        name: '',
        url: '',
        logo: '🌐',
        description: ''
      }
    })
  },

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
  },

  // 验证表单
  validateForm() {
    const { name, url } = this.data.formData
    
    if (!name.trim()) {
      wx.showToast({
        title: this.data.uiText.nameRequired,
        icon: 'none'
      })
      return false
    }
    
    if (!url.trim()) {
      wx.showToast({
        title: this.data.uiText.urlRequired,
        icon: 'none'
      })
      return false
    }
    
    // 简单的URL验证
    const urlPattern = /^https?:\/\/.+\..+/
    if (!urlPattern.test(url)) {
      wx.showToast({
        title: this.data.uiText.urlInvalid,
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 保存网站
  async saveSite() {
    if (!this.validateForm()) return
    
    this.setData({ loading: true })
    
    try {
      const { formData, editingSite, customSites } = this.data
      const api = require('../../utils/api.js')
      
      let newSites = [...customSites]
      
      if (editingSite) {
        // 编辑模式
        const index = newSites.findIndex(s => s.id === editingSite.id)
        if (index !== -1) {
          newSites[index] = {
            ...editingSite,
            name: formData.name.trim(),
            url: formData.url.trim(),
            logo: formData.logo.trim() || '🌐',
            description: formData.description.trim()
          }
        }
      } else {
        // 添加模式
        const newSite = {
          id: Date.now().toString(), // 临时ID
          name: formData.name.trim(),
          url: formData.url.trim(),
          logo: formData.logo.trim() || '🌐',
          description: formData.description.trim(),
          sort_order: newSites.length
        }
        newSites.push(newSite)
      }
      
      // 保存到云端
      const result = await api.saveCustomSites(newSites)
      
      if (result.success) {
        console.log('✅ [CustomSites] 保存成功')
        this.setData({ customSites: newSites })
        this.closeModal()
        
        wx.showToast({
          title: this.data.uiText.saveSuccess,
          icon: 'success'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ [CustomSites] 保存失败:', error)
      wx.showToast({
        title: this.data.uiText.saveError,
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 删除网站
  deleteSite(e) {
    const siteId = e.currentTarget.dataset.id
    const site = this.data.customSites.find(s => s.id === siteId)
    
    if (!site) return
    
    wx.showModal({
      title: this.data.uiText.confirmDelete,
      content: this.data.uiText.deleteConfirm,
      success: async (res) => {
        if (res.confirm) {
          await this.performDelete(siteId)
        }
      }
    })
  },

  // 执行删除
  async performDelete(siteId) {
    this.setData({ loading: true })
    
    try {
      const { customSites } = this.data
      const newSites = customSites.filter(s => s.id !== siteId)
      
      const api = require('../../utils/api.js')
      const result = await api.saveCustomSites(newSites)
      
      if (result.success) {
        console.log('✅ [CustomSites] 删除成功')
        this.setData({ customSites: newSites })
        
        wx.showToast({
          title: this.data.uiText.deleteSuccess,
          icon: 'success'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('❌ [CustomSites] 删除失败:', error)
      wx.showToast({
        title: this.data.uiText.deleteError,
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 打开网站
  openSite(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.showModal({
        title: '打开网站',
        content: '请复制链接到浏览器打开',
        confirmText: '复制链接',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: url,
              success: () => {
                wx.showToast({
                  title: '链接已复制\n请到浏览器粘贴打开',
                  icon: 'none',
                  duration: 3000
                })
              }
            })
          }
        }
      })
    }
  },

  // 阻止事件冒泡
  stopPropagation() {}
})
