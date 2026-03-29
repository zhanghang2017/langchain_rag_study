"""
Author: hangzhang
Created on Sat Mar 28 2026
Description: langchain 的 prompt 模板示例，
展示了 PromptTemplate、FewShotPromptTemplate 和 ChatPromptTemplate 三种不同类型的 prompt 模板的使用方法

"""

from langchain_core.prompts import PromptTemplate, FewShotPromptTemplate,ChatPromptTemplate,MessagesPlaceholder
from langchain_getmodel import get_model

model = get_model()

#-----------zeronshot 的 prompt 模板示例

# 定义一个 prompt 模板，使用 {username} 和 {occupation} 作为占位符
prompt_template = PromptTemplate.from_template(
    "I am {username} working on {occupation},could you give me some advice about my career?  "
)

# 使用 prompt 模板的 format 方法填充占位符，生成最终的 prompt 文本
prompt_text = prompt_template.format(
    username="hangzhang", occupation="frontend developer"
)

# response = model.invoke(prompt_text)
# print(response.content)


#-----------fewshot 的 prompt 模板示例

temp = PromptTemplate.from_template("单词：{word},反义词：{antonym}")

temp_data = [{"word": "happy", "antonym": "sad"}, {"word": "big", "antonym": "small"}]

fewshot_prompt = FewShotPromptTemplate(
    example_prompt=temp,
    examples=temp_data,
    prefix="请根据以下单词和反义词的示例，给出单词 {word} 的反义词",
    suffix="基于示例，输出单词：{word}的反义词是什么？",
    input_variables=["word"],
)

# 转化成普通文本字符串
# fewshot_prompt_text = fewshot_prompt.format(word="good")
# # 调用invoke生成的是 PromptValue对象，可以用于链
# fewshot_prompt_text2 = fewshot_prompt.invoke({"word": "good"}).to_string()
# print(fewshot_prompt_text)
# print(fewshot_prompt_text2)


#---------ChatPromptTemplate 的 prompt 模板示例


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

prompt_value = message_template.invoke({"history": history_data}).to_string()

model_response = model.invoke(prompt_value)

print(model_response.content)   