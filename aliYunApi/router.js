'use strict';
module.exports = app => {
  const { router, controller, jwt } = app;
  // 批量删除货币对交易信息
  router.delete('/coin_pair_deal/:userId/choice/:choiceId', jwt, controller.aliyunApiGateway.index);
  // 获取已创建的模型
  router.get('/describe_models', jwt, controller.aliyunApiGateway.index);
  // 删除单个订单组信息
  router.delete('/order_group/:id', jwt, controller.aliyunApiGateway.index);
  // 查询单个api信息
  router.get('/describe_api', jwt, controller.aliyunApiGateway.index);
  // 编辑更新自选货币自定义属性接口
  router.put('/coin_pair_choice_attribute_custom/', jwt, controller.aliyunApiGateway.index);
  // 删除交易平台api 接口
  router.delete('/trade_platform_api/:id', jwt, controller.aliyunApiGateway.index);
  // 根据id删除产品api接口
  router.delete('/product/:id', jwt, controller.aliyunApiGateway.index);
  // 获取数列列表
  router.get('/strategy_sequence/', jwt, controller.aliyunApiGateway.index);
  // 删除交易平台接口
  router.delete('/trade_platform/:id', jwt, controller.aliyunApiGateway.index);
  // 删除单个用户接口
  router.delete('/user/:id', jwt, controller.aliyunApiGateway.index);
  // 获取货币对交易信息
  router.get('/coin_pair_deal/:userId', jwt, controller.aliyunApiGateway.index);
  // 删除单个货币对接口
  router.delete('/coin_pair/:id', jwt, controller.aliyunApiGateway.index);
  // 解除 交易品台绑定用户套餐
  router.delete('/trade_platform_api_bind_product_combo/:id', jwt, controller.aliyunApiGateway.index);
  // 根据appId查询该app下的所有api的消息
  router.get('/describe_api_by_app', jwt, controller.aliyunApiGateway.index);
  // 删除货币排序接口
  router.delete('/coin_sort/', jwt, controller.aliyunApiGateway.index);
  // 删除用户套餐
  router.delete('/user_product_combo/:id', jwt, controller.aliyunApiGateway.index);
  // 删除单个货币信息接口
  router.delete('/coin/:id', jwt, controller.aliyunApiGateway.index);
  // 删除自选货币自定义属性接口
  router.delete('/coin_pair_choice_attribute_custom/:coinPairChoiceId', jwt, controller.aliyunApiGateway.index);
  // 删除单个平台货币对接口
  router.delete('/trade_platform_coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 删除指定id的货币对交易信息
  router.delete('/coin_pair_deal/:id', jwt, controller.aliyunApiGateway.index);
  // 删除产品套餐信息接口
  router.delete('/product_combo/:id', jwt, controller.aliyunApiGateway.index);
  // 获取指定货币对交易信息
  router.get('/coin_pair_deal/:userId/choice/:choiceId', jwt, controller.aliyunApiGateway.index);
  // 删除货币对货币接口
  router.delete('/coin_pair_coin/', jwt, controller.aliyunApiGateway.index);
  // 查询api组信息
  router.get('/describe_api_group', jwt, controller.aliyunApiGateway.index);
  // 发布所有api
  router.get('/deploy_all_api', jwt, controller.aliyunApiGateway.index);
  // 删除单个交易订单信息
  router.delete('/trade_order/:id', jwt, controller.aliyunApiGateway.index);
  // 删除自选货币属性接口
  router.delete('/coin_pair_choice_attribute/:coinPairChoiceId', jwt, controller.aliyunApiGateway.index);
  // deleteOne
  router.delete('/combo_day_reason/:id', jwt, controller.aliyunApiGateway.index);
  // 获取指定类型的交易信息
  router.get('/coin_pair_deal/:userId/type/:type', jwt, controller.aliyunApiGateway.index);
  // 删除自选货币接口
  router.delete('/coin_pair_choice/:id', jwt, controller.aliyunApiGateway.index);
  // 获取货币列表接口
  router.get('/coin/', jwt, controller.aliyunApiGateway.index);
  // 获取策略列表
  router.get('/strategy/', jwt, controller.aliyunApiGateway.index);
  // 生成CdKey
  router.post('/cd_key/generation', jwt, controller.aliyunApiGateway.index);
  // 获取验证码分页列表
  router.get('/cd_key/', jwt, controller.aliyunApiGateway.index);
  // 获取交易平台分页信息
  router.get('/trade_platform/', jwt, controller.aliyunApiGateway.index);
  // 根据交易平台id获取货币排序列表接口
  router.get('/coin_sort/', jwt, controller.aliyunApiGateway.index);
  // 获取货币对货币列表接口
  router.get('/coin_pair_coin/', jwt, controller.aliyunApiGateway.index);
  // 忘记密码接口
  router.put('/user/forget_password', jwt, controller.aliyunApiGateway.index);
  // 根据货币对name获取基础货币与计价货币
  router.get('/coin_pair_coin/base_coin', jwt, controller.aliyunApiGateway.index);
  // 获取指定数列信息
  router.get('/strategy_sequence/:id', jwt, controller.aliyunApiGateway.index);
  // 获取当前登录用户接口
  router.get('/user/current_user', jwt, controller.aliyunApiGateway.index);
  // 获取单个自选货币属性接口
  router.get('/coin_pair_choice_attribute/:coinPartnerChoiceId', jwt, controller.aliyunApiGateway.index);
  // 获取自选货币分页接口
  router.get('/coin_pair_choice/', jwt, controller.aliyunApiGateway.index);
  // 通过绑定id 和 是否开启策略 获取自选货币列表接口
  router.get('/coin_pair_choice/by_is_start', jwt, controller.aliyunApiGateway.index);
  // 根据自选货币对id查询有持仓详情
  router.get('/coin_pair_choice/position_details', jwt, controller.aliyunApiGateway.index);
  // 获取单个货币对接口
  router.get('/coin_pair/:id', jwt, controller.aliyunApiGateway.index);
  // 获取单个自选货币接口
  router.get('/coin_pair_choice/:id', jwt, controller.aliyunApiGateway.index);
  // 获取货币对列表分页接口
  router.get('/coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 获取管理员列表
  router.get('/admin/', jwt, controller.aliyunApiGateway.index);
  // 获取单个货币信息接口
  router.get('/coin/:id', jwt, controller.aliyunApiGateway.index);
  // 根据货币对name获取货币对信息接口
  router.get('/coin_pair/by_name/:name', jwt, controller.aliyunApiGateway.index);
  // 根据用户id获取交易平台api列表信息接口
  router.get('/trade_platform_api/', jwt, controller.aliyunApiGateway.index);
  // 获取分组api的ID信息
  router.get('/get_describe_apis_id', jwt, controller.aliyunApiGateway.index);
  // 获取交易参数接口
  router.get('/coin_pair_choice_attribute_custom/:coinPairChoiceId', jwt, controller.aliyunApiGateway.index);
  // 根据用户ID 获取用户未绑定的交易平台api列表 api接口
  router.get('/trade_platform_api_bind_product_combo/get_no_bind_trade_platform_api_list_by_user_id', jwt, controller.aliyunApiGateway.index);
  // 获取当前登录管理员接口
  router.get('/admin/current_admin', jwt, controller.aliyunApiGateway.index);
  // 按照条件，获取验证码分页列表
  router.get('/cd_key/search', jwt, controller.aliyunApiGateway.index);
  // 获取指定id的管理员
  router.get('/admin/:id', jwt, controller.aliyunApiGateway.index);
  // 获取事由列表接口
  router.get('/combo_day_reason/', jwt, controller.aliyunApiGateway.index);
  // 根据 自选币ID 获取交易总览
  router.get('/order_group/trade_overview', jwt, controller.aliyunApiGateway.index);
  // 获取单个事由接口
  router.get('/reason/:id', jwt, controller.aliyunApiGateway.index);
  // 获取平台货币对列表接口
  router.get('/trade_platform_coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 获取启用的产品列表
  router.get('/product/list_by_open', jwt, controller.aliyunApiGateway.index);
  // 通过用户名获取单个用户接口
  router.get('/user/get_by_username', jwt, controller.aliyunApiGateway.index);
  //  多条件查询 买入 订单 费用 总计 方法
  router.get('/trade_order/total_trade_cost_by_condition', jwt, controller.aliyunApiGateway.index);
  // 获取事由类型列表
  router.get('/reason_type/', jwt, controller.aliyunApiGateway.index);
  // 通过用户电话获取单个用户接口
  router.get('/user/get_test', jwt, controller.aliyunApiGateway.index);
  // 获取一个事由接口
  router.get('/combo_day_reason/:id', jwt, controller.aliyunApiGateway.index);
  // 根据产品id获取 未停用 的产品套餐列表
  router.get('/product_combo/list_by_product_id_and_open', jwt, controller.aliyunApiGateway.index);
  //  多条件查询 订单 收益 总计 方法
  router.get('/trade_order/total_shell_profit_by_condition', jwt, controller.aliyunApiGateway.index);
  // 获取单个交易订单信息
  router.get('/trade_order/:id', jwt, controller.aliyunApiGateway.index);
  // 获取事由列表api
  router.get('/reason/by_reason_type_id', jwt, controller.aliyunApiGateway.index);
  // 获取产品列表api接口
  router.get('/product/', jwt, controller.aliyunApiGateway.index);
  // 获取指定策略
  router.get('/strategy/:id', jwt, controller.aliyunApiGateway.index);
  // 根据产品id获取产品套餐列表
  router.get('/product_combo/list_by_product_id', jwt, controller.aliyunApiGateway.index);
  // 获取单个订单组信息
  router.get('/order_group/:id', jwt, controller.aliyunApiGateway.index);
  // 获取交易平台api单个信息接口
  router.get('/trade_platform_api/:id', jwt, controller.aliyunApiGateway.index);
  // 所有 获取交易平台api绑定用户套餐列表 api接口
  router.get('/trade_platform_api_bind_product_combo/', jwt, controller.aliyunApiGateway.index);
  // 获取产品套餐详情接口
  router.get('/product_combo/:id', jwt, controller.aliyunApiGateway.index);
  // getRoute
  router.get('/get_route', jwt, controller.aliyunApiGateway.index);
  // 获取产品详情api接口
  router.get('/product/:id', jwt, controller.aliyunApiGateway.index);
  // 通过用户电话获取单个用户接口
  router.get('/user/get_by_tel', jwt, controller.aliyunApiGateway.index);
  // 根据产品id获取未停用|停用的产品套餐列表
  router.get('/product_combo/list_by_product_id_and_status', jwt, controller.aliyunApiGateway.index);
  // 获取单个用户接口
  router.get('/user/:id', jwt, controller.aliyunApiGateway.index);
  // 根据用户ID 获取交易平台api绑定用户套餐列表 api接口
  router.get('/trade_platform_api_bind_product_combo/by_user_id', jwt, controller.aliyunApiGateway.index);
  // 获取平台货币对单个信息接口
  router.get('/trade_platform_coin_pair/:id', jwt, controller.aliyunApiGateway.index);
  // 获取交易平台单个信息接口
  router.get('/trade_platform/:id', jwt, controller.aliyunApiGateway.index);
  // 获取事由列表
  router.get('/reason/', jwt, controller.aliyunApiGateway.index);
  // 获取单个事由类型接口
  router.get('/reason_type/:id', jwt, controller.aliyunApiGateway.index);
  // 获取关闭的产品列表
  router.get('/product/list_by_close', jwt, controller.aliyunApiGateway.index);
  // 通过用户电话和用户套餐ID 获取用户套餐时长列表 接口
  router.get('/user_product_combo_day/list_by_tel_and_combo_id', jwt, controller.aliyunApiGateway.index);
  // 启用产品套餐api接口
  router.put('/product_combo/open/:id', jwt, controller.aliyunApiGateway.index);
  // 获取用户列表接口 
  router.get('/user/', jwt, controller.aliyunApiGateway.index);
  // 添加策略数列信息
  router.post('/strategy_sequence/', jwt, controller.aliyunApiGateway.index);
  // 获取用户套餐时长列表 接口
  router.get('/user_product_combo_day/', jwt, controller.aliyunApiGateway.index);
  //  多条件查询 买入日记 方法
  router.get('/trade_order/by_condition_for_buy_logs', jwt, controller.aliyunApiGateway.index);
  // 添加货币对交易信息
  router.post('/coin_pair_deal/', jwt, controller.aliyunApiGateway.index);
  // 添加策略数列信息
  router.post('/strategy_sequence/value/', jwt, controller.aliyunApiGateway.index);
  // 查询用户套餐列表接口
  router.get('/user_product_combo/', jwt, controller.aliyunApiGateway.index);
  //  多条件查询 卖出收益总结 方法
  router.get('/trade_order/by_condition_for_shell_profit', jwt, controller.aliyunApiGateway.index);
  // 获订单组列表
  router.get('/order_group/', jwt, controller.aliyunApiGateway.index);
  // 授权所有API到APP中
  router.get('/set_apps_authorities_response', jwt, controller.aliyunApiGateway.index);
  // 通过用户电话 获取用户套餐时长列表 接口
  router.get('/user_product_combo_day/list_by_tel', jwt, controller.aliyunApiGateway.index);
  // 修改api
  router.get('/modify_api', jwt, controller.aliyunApiGateway.index);
  //  查询 订单组name 方法
  router.get('/order_group/search_group', jwt, controller.aliyunApiGateway.index);
  // 设置交易参数接口
  router.post('/coin_pair_choice_attribute_custom/', jwt, controller.aliyunApiGateway.index);
  // 按查询条件获取用户列表接口 
  router.get('/user/search', jwt, controller.aliyunApiGateway.index);
  // 根据用户电话和id查询用户套餐api接口
  router.get('/user_product_combo/list_by_user_tel_and_id', jwt, controller.aliyunApiGateway.index);
  // 根据计价货币id查询有买卖记录的货币对
  router.get('/coin_pair_choice/record', jwt, controller.aliyunApiGateway.index);
  // 获取token接口
  router.post('/oauth/token', jwt, controller.aliyunApiGateway.index);
  // 验证码续费
  router.post('/cd_key/renew', jwt, controller.aliyunApiGateway.index);
  // 根据用户Id查询用户套餐api接口
  router.get('/user_product_combo/list_by_user_id', jwt, controller.aliyunApiGateway.index);
  // 更新指定id的管理员
  router.put('/admin/', jwt, controller.aliyunApiGateway.index);
  // 获取交易订单列表
  router.get('/trade_order/', jwt, controller.aliyunApiGateway.index);
  // 更新单个货币信息接口
  router.put('/coin/', jwt, controller.aliyunApiGateway.index);
  // 启用产品接口
  router.put('/product/open/:id', jwt, controller.aliyunApiGateway.index);
  // 通过用户套餐ID 获取用户套餐时长列表 接口
  router.get('/user_product_combo_day/list_by_user_product_combo_id', jwt, controller.aliyunApiGateway.index);
  // 导入consumer中全部接口的api
  router.get('/import_consumer_api', jwt, controller.aliyunApiGateway.index);
  // 根据用户电话查询用户套餐api接口
  router.get('/user_product_combo/list_by_user_tel', jwt, controller.aliyunApiGateway.index);
  // resetPassword
  router.put('/admin/reset_password', jwt, controller.aliyunApiGateway.index);
  // 更新产品套餐信息接口
  router.put('/product_combo/', jwt, controller.aliyunApiGateway.index);
  // 更新货币对货币接口
  router.put('/coin_pair_coin/', jwt, controller.aliyunApiGateway.index);
  // 更新单个平台货币对接口
  router.put('/trade_platform_coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 更新自选货币接口
  router.put('/coin_pair_choice/', jwt, controller.aliyunApiGateway.index);
  // 修改用户名
  router.put('/user/update_username/:id', jwt, controller.aliyunApiGateway.index);
  // 更新交易平台接口
  router.put('/trade_platform/', jwt, controller.aliyunApiGateway.index);
  // 修改用户密码
  router.put('/user/update_password/:id', jwt, controller.aliyunApiGateway.index);
  // 更新交易平台api接口
  router.put('/trade_platform_api/', jwt, controller.aliyunApiGateway.index);
  // 用户绑定谷歌验证接口
  router.put('/user/update_binding', jwt, controller.aliyunApiGateway.index);
  // 更新用户接口
  router.put('/user/', jwt, controller.aliyunApiGateway.index);
  // 更新自选货币属性接口
  router.put('/coin_pair_choice_attribute/', jwt, controller.aliyunApiGateway.index);
  // 更新单个事由接口
  router.put('/combo_day_reason/', jwt, controller.aliyunApiGateway.index);
  // 更新 交易平添api绑定用户套餐 api接口
  router.put('/trade_platform_api_bind_product_combo/:id', jwt, controller.aliyunApiGateway.index);
  // 更新单个交易订单组信息
  router.put('/order_group/', jwt, controller.aliyunApiGateway.index);
  // 更改用户状态
  router.put('/user/status', jwt, controller.aliyunApiGateway.index);
  // 更新货币排序接口
  router.put('/coin_sort/', jwt, controller.aliyunApiGateway.index);
  // 更新单个货币对接口
  router.put('/coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 更新货币对交易状态
  router.put('/coin_pair_deal/status', jwt, controller.aliyunApiGateway.index);
  // 修改电话号码
  router.put('/user/update_tel/:id', jwt, controller.aliyunApiGateway.index);
  // 启用、关闭产品套餐api接口
  router.put('/product_combo/:id', jwt, controller.aliyunApiGateway.index);
  // 更新产品api接口
  router.put('/product/', jwt, controller.aliyunApiGateway.index);
  // 启用、关闭产品api接口
  router.put('/product/:id', jwt, controller.aliyunApiGateway.index);
  // 添加用户套餐信息api接口
  router.post('/user_product_combo/', jwt, controller.aliyunApiGateway.index);
  // 检查token列表接口
  router.get('/oauth/check_token', jwt, controller.aliyunApiGateway.index);
  // 添加货币对货币接口
  router.post('/coin_pair_coin/', jwt, controller.aliyunApiGateway.index);
  // 添加策略的详细信息
  router.post('/strategy/attribute/', jwt, controller.aliyunApiGateway.index);
  // 添加管理员信息
  router.post('/admin/', jwt, controller.aliyunApiGateway.index);
  // 添加单个货币对接口
  router.post('/coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 添加平台货币对单个信息接口
  router.post('/trade_platform_coin_pair/', jwt, controller.aliyunApiGateway.index);
  // 关闭产品套餐api接口
  router.put('/product_combo/close/:id', jwt, controller.aliyunApiGateway.index);
  // 删除指定id的管理员
  router.delete('/admin/:id', jwt, controller.aliyunApiGateway.index);
  // 添加一个事由接口
  router.post('/combo_day_reason/', jwt, controller.aliyunApiGateway.index);
  // 获添加品套餐信息接口
  router.post('/product_combo/', jwt, controller.aliyunApiGateway.index);
  // 删除所有api
  router.get('/delete_all_api', jwt, controller.aliyunApiGateway.index);
  // 添加单个用户接口
  router.post('/user/', jwt, controller.aliyunApiGateway.index);
  // 批量删除自选货币接口
  router.delete('/coin_pair_choice/batch', jwt, controller.aliyunApiGateway.index);
  // 机器人绑定api接口
  router.post('/trade_platform_api_bind_product_combo/binding', jwt, controller.aliyunApiGateway.index);
  // 添加策略信息
  router.post('/strategy/', jwt, controller.aliyunApiGateway.index);
  // 添加交易平台api单个信息接口
  router.post('/trade_platform_api/', jwt, controller.aliyunApiGateway.index);
  // 获取交易货币对数量
  router.get('/coin_pair_deal/count/:userId', jwt, controller.aliyunApiGateway.index);
  // 检查自选币
  router.get('/coin_pair_choice/check_coin_pair_choice', jwt, controller.aliyunApiGateway.index);
  // 关闭产品接口
  router.put('/product/close/:id', jwt, controller.aliyunApiGateway.index);
  // 获取货币对交易的下单数
  router.get('/coin_pair_deal/count/:userId/choice/:choiceId', jwt, controller.aliyunApiGateway.index);
  // 添加产品api接口
  router.post('/product/', jwt, controller.aliyunApiGateway.index);
  // 添加交易平台单个信息接口
  router.post('/trade_platform/', jwt, controller.aliyunApiGateway.index);
  // 添加自选货币接口
  router.post('/coin_pair_choice/', jwt, controller.aliyunApiGateway.index);
  // 添加单个货币排序接口
  router.post('/coin_sort/', jwt, controller.aliyunApiGateway.index);
  // 验证码激活
  router.post('/cd_key/activation', jwt, controller.aliyunApiGateway.index);
  // 添加用户套餐时长操作信息api接口
  router.post('/user_product_combo_day_by_admin/', jwt, controller.aliyunApiGateway.index);
  // 添加单个货币信息接口
  router.post('/coin/', jwt, controller.aliyunApiGateway.index);
  // 下线所有api
  router.get('/abolish_all_api', jwt, controller.aliyunApiGateway.index);
  // 添加自选货币属性接口
  router.post('/coin_pair_choice_attribute/', jwt, controller.aliyunApiGateway.index);
};
