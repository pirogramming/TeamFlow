from django.shortcuts import render

# 랜딩 페이지 (구글 로그인 버튼 포함)
def landing_page(request):
    return render(request, 'landing/index.html')
