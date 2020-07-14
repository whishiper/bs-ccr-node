# @Author  : YuXueWen
# @File    : createNodeDevComposeFile.py
# @Email    : 8586826@qq.com

import docker_config.config
import docker_config.check as check
import os
import codecs
import subprocess


class NodeDevComposeFile():

    def __init__(self):
        self.base_dict = docker_config.config.base

        self.nodeDevName = check.set_default_value_by_check(check.config('nodeDevName', 'base'))
        self.nodeDevPort = check.set_default_value_by_check(check.config('port', 'base'), '9100')
        self.nodeFileName = check.set_default_value_by_check(check.config('nodeFileName', 'base'), 'docker-compose.yml')



        self.currentPath = os.getcwd()
        self.projectPath = os.path.abspath('../..')
        self.currentProjectName = os.path.basename(self.projectPath)

    def create(self):
        """
        创建docker compose file
        Returns:
        """
        print(self.nodeDevPort)
        print(self.nodeFileName)
        self.base_dict['currentPath'] = self.currentPath
        self.base_dict['projectPath'] = self.projectPath
        self.base_dict['currentProjectName'] = self.currentProjectName
        self.base_dict['yarn_cache_dir'] = ''

        result_yarn_cache_dir = subprocess.getstatusoutput('yarn cache dir')
        if result_yarn_cache_dir[0] == 0:
            self.base_dict['yarn_cache_dir'] = '- ' + result_yarn_cache_dir[1] + ':/usr/local/share/.cache/yarn/v4';

        read_docker_compose_node_template = codecs.open('docker_config/docker-compose-node-template.yml', 'r', 'utf-8');

        read_docker_compose_node_content_list = []
        while True:
            line = read_docker_compose_node_template.readline();
            read_docker_compose_node_content_list.append(line % self.base_dict)
            if not line: break
        read_docker_compose_node_template.close()

        write_docker_compose_node_file = codecs.open(self.nodeFileName, 'w+', 'utf-8');
        write_docker_compose_node_file.writelines(read_docker_compose_node_content_list)
        write_docker_compose_node_file.close()

    def delete(self):
        """
        创建docker compose file
        Returns:

        """
