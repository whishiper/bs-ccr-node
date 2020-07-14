# @Author  : YuXueWen
# @File    : docker.py
# @Email    : 8586826@qq.com

from sys import argv
import os
import docker_config.nodeDevComposeFile


class docker:

    def __init__(self):
        self.currentPath = os.getcwd()
        self.projectPath = os.path.abspath('..')
        self.currentProjectName = os.path.basename(self.projectPath)

    def init(self, option=[]):
        """
        初始化docker compose files
        Returns: NULL
        """
        nodeDevComposeFile = docker_config.nodeDevComposeFile.NodeDevComposeFile()
        nodeDevComposeFile.nodeDevName = self.currentProjectName
        nodeDevComposeFile.currentPath = self.currentPath
        nodeDevComposeFile.projectPath = self.projectPath
        nodeDevComposeFile.currentProjectName = self.currentProjectName
        nodeDevComposeFile.create()

    def start(self, option=[]):
        print(option)

    def stop(self, option=[]):
        print(option)
        print("stop....")

    def exec(self):
        """
        动态执行对应的方法
            option 为参数
        Returns: None
        """

        if hasattr(self, argv[1]):
            argvLen = len(argv)
            option = [];
            if argvLen < 1:
                raise Exception("请输入对应的参数")
            elif argvLen > 2:
                option = argv[2:len(argv)];

            execFunc = getattr(self, argv[1], option)
            execFunc()

        else:
            raise Exception("方法不存在")


docker = docker()
docker.exec()
