
"""
 Author: hangzhang
 Created on Sat Mar 28 2026
 Description: langchain 的文本嵌入模型示例，使用 DashScopeEmbeddings 模型将文本转化为向量表示
"""


import os

from dotenv import load_dotenv
from langchain_community.embeddings import DashScopeEmbeddings,ZhipuAIEmbeddings

# 加载同目录下的 .env 文件
load_dotenv()

# 文本嵌入模型，用于将文本转化为向量表示，后续会将文本向量存储到向量数据库中，供检索使用
# model 可以不用传，默认就是 text-embedding-v1 模型，这里为了演示传入了参数
embeddings = DashScopeEmbeddings(
    model="text-embedding-v1", dashscope_api_key=os.getenv("DASHSCOPE_API_KEY")
)

zhipu_embeddings = ZhipuAIEmbeddings(
    model="embedding-3", api_key=os.getenv("ZHIPUAI_API_KEY")
)

def get_embedding():
    return embeddings

def get_zhipu_embedding():
    return zhipu_embeddings