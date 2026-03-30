"""
Author: hangzhang
Created on Sun Mar 30 2026
Description:向量检索入链示例，使用了Chroma作为向量数据库，构建了一个简单的检索链，将检索到的文档内容格式化后输入到提示词模板中，再将生成的提示词输入到语言模型中进行回答生成。
"""

# 轻量级的向量数据库，适合本地使用，支持多种嵌入模型，可以将文本转化为向量表示，并存储到本地磁盘中，供后续检索使用
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

# 用于向量化文本的嵌入模型，这里使用了之前定义的 get_embedding 函数来获取嵌入模型实例
from langchain_getEbedding import get_zhipu_embedding

from langchain_getmodel import get_model

model = get_model()


# --------------------构建本地向量数据库--start-----------------

# 使用example09 构建的向量库
vector_store = Chroma(
    collection_name="pdf_docs",
    embedding_function=get_zhipu_embedding(),
    persist_directory="./local_db",
)
# --------------------构建本地向量数据库--end-------------------
# 检索器，search_type 是检索类型，这里使用了相似度检索，search_kwargs 中的 k 是返回的最相似的文档数量，可以根据需要调整这个参数
# 需要入链必须使用这个方法，返回runnabele的检索器对象
retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3})

# 构建提示词模板
chat_prompt = ChatPromptTemplate.from_template(
    # 定义模板：注意 {context} 和 {question} 是固定占位符
    template="""你是一个经济研究专家。请根据以下提供的检索内容来回答用户的问题。
如果检索内容中没有相关信息，请直接回答“我不知道”，不要胡编乱造。

检索内容:
{context}

用户问题:
{question}

回答："""
)


# 定义一个函数来格式化检索到的文档内容，输入是一个文档列表，输出是一个字符串，将文档内容拼接在一起，如果没有检索到相关内容，则返回一个提示信息
def format_docs(docs):
    # print("检索结果", docs)
    if not docs:
        return "#没有检索到相关内容#"
    formatted_docs = "\n".join([f"{doc.page_content}" for doc in docs])
    return "#" + formatted_docs + "#"


chain = (
    # 字典必须值都是runnable子类，字典才会转化成 rannable子类,RunnablePassthrough 是一个简单的runnable类，它的作用是将输入直接传递给输出，不进行任何处理，这里用它来传递用户的问题
    {
        "context": retriever | RunnableLambda(format_docs),
        "question": RunnablePassthrough(),
    }
    | chat_prompt
    | model
)

chunks = chain.stream("中国近代经济史的特点?")
for chunk in chunks:
    print(chunk.content, end="",flush=True)
