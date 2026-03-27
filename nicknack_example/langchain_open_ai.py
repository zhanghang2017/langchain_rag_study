from langchain_openai import ChatOpenAI
from dotenv import load_dotenv  # provided by the python-dotenv package
from langchain_core.messages import HumanMessage, SystemMessage
import os


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
model_name = os.getenv("OPENAI_MODEL")

model = ChatOpenAI(model=model_name, api_key=api_key, base_url=base_url, temperature=0)
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