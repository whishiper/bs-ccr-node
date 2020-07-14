# @Author  : YuXueWen
# @File    : check.py
# @Email    : 8586826@qq.com

import docker_config.config


class check:
    # def __init__(self):

    def config(self, attr_key, type_name=[]):
        if len(attr_key) <= 1:
            raise ValueError('请输入一个要检测的正确的键')

        if isinstance(type_name, list):
            print('list')
        else:
            if hasattr(docker_config.config, type_name):
                return attr_key in getattr(docker_config.config, type_name)

    def config_with_exception(self, attr_key, type_name=[]):
        if not config(attr_key, type_name=[]):
            raise AttributeError('属性不存在')

    def set_default_value_by_check(self, bool, value='default'):
        if not bool:
            return value;
