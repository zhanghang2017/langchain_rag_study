
# 计算余弦相似度

# 计算点积
def get_dot(vec_a, vec_b):
    if len(vec_a) != len(vec_b):
        raise ValueError("Vectors must be of the same length")
    return sum(a * b for a, b in zip(vec_a, vec_b))

# 计算模长
def get_temp(vec):
    sum = 0
    for i in vec:
        sum += i ** 2
    return sum ** 0.5


def get_cosine_similary(vec_a, vec_b):
    dot = get_dot(vec_a, vec_b)
    temp_a = get_temp(vec_a)
    temp_b = get_temp(vec_b)
    if temp_a == 0 or temp_b == 0:
        return 0.0
    else:
        return dot / (temp_a * temp_b)
    
print(get_cosine_similary([1, 2, 3], [4, 5, 6]))