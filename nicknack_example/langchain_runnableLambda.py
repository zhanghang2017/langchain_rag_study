"""
Author: hangzhang
Created on Sat Mar 28 2026
Description: langchain 的 RunnableLambda 示例，展示了如何将 ChatPromptTemplate 和模型组合成一个链，并调用链生成响应，

"""

from langchain_core.prompts import ChatPromptTemplate, PromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableSerializable
from langchain_core.runnables import RunnableLambda
from langchain_getmodel import get_model


model = get_model()


message_template = ChatPromptTemplate.from_messages(
    [
        ("system", "你是一名中国厨师"),
        MessagesPlaceholder("history"),
    ]
)

history_data = [
    ("human", "你是谁？"),
    ("assistant", "我是一名中国厨师"),
    (
        "human",
        """"
              给我推荐5道川菜,要求荤菜。
     """,
    ),
]


introduce_template = PromptTemplate.from_template(
    """
    你是一名中国厨师，擅长介绍各种菜肴的做法。
    以下是你要介绍的菜肴信息：
    {course}
    请详细介绍其中一道菜的做法。
    """
)

my_lambda = RunnableLambda(lambda ai_msg: {"course": ai_msg.content})

chain: RunnableSerializable = (
    message_template | model | my_lambda | introduce_template | model
)

chain_stream_response = chain.stream({"history": history_data})


for response in chain_stream_response:
    print(response.content, end="", flush=True)
