"""
 Author: hangzhang
 Created on Sat Mar 28 2026
 Description: langchain 的语言模型示例，展示了如何使用 ChatOpenAI 模型进行文本生成，
 包括直接输出、流式输出和消息类型的流式输出三种不同的调用方式

"""

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_getmodel import get_model

model = get_model()

# 直接输出
# response = model.invoke("请介绍一下你自己")
# print(response.content)

# 流式输出
# chunks = model.stream("请介绍一下你自己")

# for chunk in chunks:
#     print(chunk.content, end="", flush=True)

# 消息类型的流式输出
messages = [SystemMessage(content="你是一个来自中国的厨师"), HumanMessage(content="请介绍一下红烧鱼的做法")]
chunks = model.stream(messages)

for chunk in chunks:
    print(chunk.content, end="", flush=True)
    
    