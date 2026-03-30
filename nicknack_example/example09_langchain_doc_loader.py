"""
Author: hangzhang
Created on Sun Mar 29 2026
Description: langchain 的文档加载器示例，演示使用 PyPdfLoader 加载 PDF 文档，向量化持久化，
csv、txt、epub 等其他类型的文档加载器使用方法类似，具体可以参考 langchain 的官方文档。

"""

import os
from langchain_community.document_loaders import PyPDFLoader

# 轻量级的向量数据库，适合本地使用，支持多种嵌入模型，可以将文本转化为向量表示，并存储到本地磁盘中，供后续检索使用
from langchain_chroma import Chroma

# 用于向量化文本的嵌入模型，这里使用了之前定义的 get_embedding 函数来获取嵌入模型实例
from langchain_getEbedding import get_zhipu_embedding

# 拆分文本的工具，可以将长文本拆分成更小的块，方便后续处理，比如存储到向量数据库中，或者作为模型输入
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


# 初始化嵌入模型
embeddings = get_zhipu_embedding()

file_path = os.path.join(os.getcwd(), "files/Modern Economic History of China.pdf")


# 将文本转化为 Document 对象，并存储到向量数据库中，metadata 中可以存储一些额外的信息，这里我们存储了 source 字段，表示文档来源，可以在检索时使用这个字段进行过滤
def to_store_doc(chunks, file_path):
    docs = []
    for chunk in chunks:
        doc = Document(page_content=chunk, metadata={"source": file_path})
        docs.append(doc)
    return docs


# 持久化数据
def vector_store_data(
    file_path, collection_name, persist_directory, embedding_function
):
    # --------------------构建本地向量数据库--start-----------------
    # 创建或加载本地数据库
    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=embedding_function,
        persist_directory=persist_directory,
    )
    # --------------------构建本地向量数据库--end-------------------
    # chunk_size 是拆分后每个块的最大长度，chunk_overlap 是拆分后块与块之间的重叠部分长度，这样可以保证上下文的连续性，避免信息丢失
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    loader = PyPDFLoader(file_path=file_path, mode="page")

    # 使用 lazy_load 方法加载文档，返回一个生成器，可以逐页加载文档内容，节省内存
    content_chunks = loader.lazy_load()

    # chunk 是按照上下页拆，拆分可能导致语义不完整，导致向量文本数据库检索效果不好
    # 需要做前页最后一个chunk+后页的重叠，一起给文本拆分工具进行拆分，保证上下文的连续性，提升向量文本数据库的检索效果
    remain_buffer = ""
    for page in content_chunks:
        current_page_content = remain_buffer + page.page_content

        # 2. 对拼接后的内容进行切分
        # 注意：这里我们传入的是字符串，而不是 Document 对象，以确保切分器能跨越原有的页码边界
        chunks = text_splitter.split_text(current_page_content)
        if len(chunks) > 1:
            # 向量化存储向量库
            print(f"当前页切分成了 {len(chunks)} 条 ，正在存储到向量数据库中...")
            docs = to_store_doc(chunks[:-1], file_path)
            vector_store.add_documents(docs)
            remain_buffer = chunks[-1]
        else:
            # 如果切分后的块数量不大于1，说明当前页内容较短，可以直接保留为下一轮的前页内容
            remain_buffer = current_page_content

    if remain_buffer:
        # 处理最后剩余的内容，确保不会丢失
        chunks = text_splitter.split_text(remain_buffer)
        # 向量化存储向量库
        print(f"正在存储块到向量数据库中: {len(chunks)}条...")
        docs = to_store_doc(chunks, file_path)
        vector_store.add_documents(docs)


# 向量化存储数据到向量数据库中，collection_name 是向量数据库中的集合名称，persist_directory 是向量数据库的持久化目录，embedding_function 是用于向量化文本的嵌入模型实例
# vector_store_data(
#     file_path=file_path,
#     collection_name="pdf_docs",
#     persist_directory="./local_db",
#     embedding_function=embeddings,
# )
