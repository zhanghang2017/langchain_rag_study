
"""
Author: hangzhang
Created on Sat Mar 28 2026
Description: chain 的示例，展示了如何将 ChatPromptTemplate 和模型组合成一个链，并调用链生成响应

"""

from langchain_core.prompts import ChatPromptTemplate, PromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableSerializable
from langchain_getmodel import get_model
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

model = get_model()

#-------------StrOutputParser示例------------------

# message_template = ChatPromptTemplate.from_messages(
#     [
#         ("system", "你是一名中国厨师"),
#         MessagesPlaceholder("history"),
#     ]
# )

# history_data = [
#     ("human", "你是谁？"),
#     ("assistant", "我是一名中国厨师"),
#     ("human", "给我推荐一些川菜？"),
# ]

# model_output_parser = StrOutputParser()

# # 模型输入只接受 str promptValue,sequence等,所有 第一个model输出的AImessage需要被管道转化成str
# chain: RunnableSerializable = message_template | model | model_output_parser | model


# chain_response = chain.invoke({"history": history_data})

# print(chain_response.content)

# chain_stream_response = chain.stream({"history": history_data})

# for response in chain_stream_response:
#     print(response.content, end="", flush=True)


# ----------------------jsonoutput 示例------------------------


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
              给我推荐5道川菜，请以json对象输出，course作为菜单列表的key,列表对象：name作为key,value作为菜名
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

course_json_parse = JsonOutputParser()
chain: RunnableSerializable = (
    message_template | model | course_json_parse | introduce_template | model
)

chain_stream_response = chain.stream({"history": history_data})


for response in chain_stream_response:
    print(response.content, end="", flush=True)
