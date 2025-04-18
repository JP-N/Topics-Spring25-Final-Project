from fastapi import APIRouter, Path, HTTPException, status
from pydantic import BaseModel
from typing import List

music_router = APIRouter()

class MusicItem(BaseModel):
    id: int
    title: str
    artist: str
    description: str = ""

class MusicItemRequest(BaseModel):
    title: str 
    artist: str 
    description: str = ""

music_list = []
max_id: int = 0

#create a new music item
@music_router.post("", status_code = status.HTTP_201_CREATED, response_model = MusicItem)
def add_music(item: MusicItemRequest): #accepts request model without id
    global max_id
    max_id += 1
    new_item = MusicItem(id = max_id, title = item.title, artist = item.artist, description = item.description)
    music_list.append(new_item)
    return new_item

#reads all music items
@music_router.get("", response_model = List[MusicItem])
def get_music():
    return music_list

#gets a specific music item by id
@music_router.get("/{id}", response_model = MusicItem)
def get_music_by_id(id: int = Path(..., title= "Music ID")):
    for item in music_list:
        if item.id == id:
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Music item with ID={id} not found.")

#updates a music item
@music_router.put("/{id}", response_model= MusicItem)
def update_music(id: int, updated_item: MusicItemRequest):
    for index, item in enumerate(music_list):
        if item.id == id:
            music_list[index] = MusicItem(id=id, **updated_item.dict())
            return music_list[index]
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Music item with ID={id} not found.")

#deletes a music item
@music_router.delete("/{id}")
def delete_music(id: int):
    global music_list
    music_list = [item for item in music_list if item.id != id]
    return {"message": f"Music item with ID={id} has been deleted."}