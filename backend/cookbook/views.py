from django.http import HttpResponse

def root(request):
    return HttpResponse("Ninang Rhobby's Cookbook API Root")
