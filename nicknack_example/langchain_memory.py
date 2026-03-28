"""
Author: hangzhang
Created on Sat Mar 28 2026
Description: langchain 短期记忆示例，展示了如何使用 RunnableWithMessageHistory 来管理对话历史，并将其与模型和提示模板组合成一个链，以实现基于对话历史的响应生成。

"""

from langchain_core.runnables import RunnableLambda
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import PromptTemplate
from langchain_getmodel import get_model

model = get_model()

prompt_template = PromptTemplate.from_template(
    """你是一名中国厨师，擅长介绍各种菜肴的做法。
    以下是你和用户的对话历史：{history}，
    请根据对话历史和用户输入{input} 回答。"""
)


def print_prompt_lambda(prompt_value):
    print(f"{'====' * 20} ")
    print(prompt_value.to_string())
    print(f"{'====' * 20} ")
    return prompt_value


chain = prompt_template | RunnableLambda(print_prompt_lambda) | model

history = {}


# 定义一个函数来获取对话历史，如果没有则创建一个新的 InMemoryChatMessageHistory 对象
def get_history(session_id: str):
    if session_id not in history:
        history[session_id] = InMemoryChatMessageHistory()
    return history[session_id]


# 定义一个 RunnableWithMessageHistory，将链和获取历史的函数组合起来，指定输入键和历史键
memory_chain = RunnableWithMessageHistory(
    chain,
    get_history,
    input_messages_key="input",
    history_messages_key="history",
)

# 模拟一个对话场景，用户输入一些问题，调用 memory_chain 生成响应，并将用户输入和模型响应添加到历史中
session_id = "user1"


config = {"configurable": {"session_id": session_id}}
memory_chain.invoke({"input": "你是谁"}, config)
memory_chain.invoke({"input": "你擅长做哪些川菜"}, config)
chunks = memory_chain.stream({"input": "给我介绍一下你最拿手的川菜做法"}, config)

# for chunk in chunks:
#     print(chunk.content, end="", flush=True)
