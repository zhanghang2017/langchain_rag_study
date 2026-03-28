"""
 Author: hangzhang
 Created on Sat Mar 28 2026
 Description: 获取语言模型的示例，这里使用了 ChatOpenAI 模型，并通过环境变量传入了模型的相关参数，包括 API key、base URL 和模型名称

"""

from langchain_openai import ChatOpenAI
from dotenv import load_dotenv  # provided by the python-dotenv package

import os


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL")
model_name = os.getenv("OPENAI_MODEL")

model = ChatOpenAI(model=model_name, api_key=api_key, base_url=base_url, temperature=0)

def get_model():
    return model