"""
 Author: hangzhang
 Created on Sat Mar 28 2026
 Description: chain 的示例，展示了如何将 ChatPromptTemplate 和模型组合成一个链，并调用链生成响应

"""
from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain_core.runnables import RunnableSerializable
from langchain_getmodel import get_model

model = get_model()

message_template = ChatPromptTemplate.from_messages([
    ("system", "你是一名中国厨师"),
    MessagesPlaceholder("history"),
    ("human", "请问你会做什么菜？")
    
])

history_data = [
    ("human", "你是谁？"),
    ("assistant", "我是一名中国厨师"),
    ("human", "给我推荐一些川菜？"),
    ("assistant", "川菜以麻辣为主，推荐你尝试一下麻婆豆腐和水煮鱼")
]

chain: RunnableSerializable = message_template | model


# chain_response = chain.invoke({"history": history_data})

# print(chain_response.content)

chain_stream_response = chain.stream({"history": history_data})

for response in chain_stream_response:
    print(response.content, end="", flush=True)