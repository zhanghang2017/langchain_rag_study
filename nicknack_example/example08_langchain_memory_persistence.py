"""
Author: hangzhang
Created on Sun Mar 29 2026
Description: 文件长期记忆示例，展示了如何实现一个 JsonFileChatMessageHistory 类，将对话历史存储到 JSON 文件中，并通过 RunnableWithMessageHistory 来管理对话历史，实现基于文件存储的长期记忆机制。

"""

import json
import os
from collections.abc import Sequence
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import messages_from_dict, messages_to_dict, BaseMessage
from langchain_core.runnables import RunnableLambda
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import ChatPromptTemplate,MessagesPlaceholder
from langchain_getmodel import get_model

model = get_model()

# 定义一个 JsonFileChatMessageHistory 类，继承自 BaseChatMessageHistory，实现了将对话历史存储到 JSON 文件中的功能
class JsonFileChatMessageHistory(BaseChatMessageHistory):
    storage_path: str
    session_id: str
    
    def __init__(self, storage_path, session_id):
        self.storage_path = storage_path
        self.session_id = session_id
        # 当前程序工作目录
        current_dir = os.getcwd()
        print(f"当前工作目录: {current_dir}")
        self.file_path = os.path.join(current_dir, self.storage_path, self.session_id)
    
    @property
    def messages(self) -> Sequence[BaseMessage]:
      
        file_path = self.file_path
        
        if not os.path.exists(file_path):
            return []
        
        with open(file_path, "r", encoding="utf-8") as f:
            serialized = json.load(f)
        
        return messages_from_dict(serialized)
        
    def add_messages(self, messages: Sequence[BaseMessage]) -> None:
        all_messages = list(self.messages)
        all_messages.extend(messages)
        serialized = messages_to_dict(all_messages)
    
        file_path = self.file_path

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(serialized, f)
            
    def clear(self) -> None:

        file_path = self.file_path
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump([], f)

#---------开始构建链---------



prompt_template = ChatPromptTemplate.from_messages(
    [
        ("system", "你是一名中国厨师，擅长介绍各种菜肴的做法。"),
        MessagesPlaceholder("history_data"),
        ("user", "请根据对话历史和用户输入{input} 回答。")
    ]
)

#自定义一个 RunnableLambda 来打印提示模板的内容，方便我们观察提示模板中历史记录的变化情况
def print_prompt_lambda(prompt_value):
    print(f"{'====' * 20} ")
    print(prompt_value.to_string())
    print(f"{'====' * 20} ")
    return prompt_value


chain = prompt_template | RunnableLambda(print_prompt_lambda) | model

history = {}


# 定义一个函数来获取对话历史,从文件中读取，这里和短期记忆机制一样，只是把内存中的历史替换成了从文件中读取的历史，如果没有则创建一个新的 JsonFileChatMessageHistory 对象
def get_history(session_id: str):
   return JsonFileChatMessageHistory(storage_path="chat_history", session_id=session_id)


# 定义一个 RunnableWithMessageHistory，将链和获取历史的函数组合起来，指定输入键和历史键
memory_chain = RunnableWithMessageHistory(
    chain,
    get_history,
    input_messages_key="input",
    history_messages_key="history_data",
)

# 模拟一个对话场景，用户输入一些问题，调用 memory_chain 生成响应，并将用户输入和模型响应添加到历史中
session_id = "user1"


# 可以删除chat_history 目录下的 user1 文件来测试从头开始的对话历史记录，
# 运行一次之后，注释前面两个invoke，再次运行，看看历史记录是否正确加载并影响了模型的响应生成。
config = {"configurable": {"session_id": session_id}}
memory_chain.invoke({"input": "你是谁"}, config)
memory_chain.invoke({"input": "你擅长做哪些川菜"}, config)
chunks = memory_chain.stream({"input": "给我介绍一下你最拿手的川菜做法"}, config)

for chunk in chunks:
    print(chunk.content, end="", flush=True)

