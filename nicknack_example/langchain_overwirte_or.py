"""
 Author: hangzhang
 Created on Sat Mar 28 2026
 Description: langchain 管道示例，展示了如何将 ChatPromptTemplate 和模型组合成一个链，
 并调用链生成响应，本质是重写 __or__ 方法实现链式调用

"""

from typing import List

class _Runnable:
    def __init__(self, name):
        self.name = name
    def __or__(self, value):
        return Sequence(self,value)
    
    def __str__(self):
        return self.name

class Sequence:
    def __init__(self, *args):
        self.sequence: List = []
        for arg in args:
            self.sequence.append(arg)
            
    def __or__(self, value):
        self.sequence.append(value)
        return self
    def run(self):
        for item in self.sequence:
            print(item)
    
a = _Runnable("a")
b = _Runnable("b")
c = _Runnable("c")

d = a | b | c

d.run()


  