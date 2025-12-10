"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { X } from "lucide-react";

interface Class {
  id: string;
  name: string;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  tag: string;
  dueDate: string;
  completed: boolean;
  classId: string;
}

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemTag, setNewItemTag] = useState<"assignment" | "midterm">(
    "assignment"
  );
  const [newItemDueDate, setNewItemDueDate] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [filterDueDate, setFilterDueDate] = useState<string>("");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [selectedClassId, filterTag, filterCompleted, filterDueDate]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id);
        }
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      setClasses([]);
    }
  };

  const fetchItems = async () => {
    if (!selectedClassId) return;
    try {
      const params = new URLSearchParams({ classId: selectedClassId });
      if (filterTag !== "all") params.append("tag", filterTag);
      if (filterCompleted !== "all")
        params.append("completed", filterCompleted);
      if (filterDueDate) params.append("dueDate", filterDueDate);

      const response = await fetch(`/api/items?${params}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
    }
  };

  const createClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName }),
      });
      const data = await response.json();
      if (response.ok && data.id) {
        setClasses([...classes, data]);
        setNewClassName("");
        setSelectedClassId(data.id);
      } else {
        console.error("Failed to create class:", data.error);
        alert(`Failed to create class: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Failed to create class. Please check your database connection.");
    }
  };

  const deleteClass = async (id: string) => {
    await fetch(`/api/classes/${id}`, { method: "DELETE" });
    const updatedClasses = classes.filter((c) => c.id !== id);
    setClasses(updatedClasses);
    if (selectedClassId === id) {
      setSelectedClassId(
        updatedClasses.length > 0 ? updatedClasses[0].id : null
      );
    }
  };

  const addItem = async () => {
    if (!newItemName.trim() || !newItemDueDate || !selectedClassId) return;
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newItemName,
        tag: newItemTag,
        dueDate: newItemDueDate,
        classId: selectedClassId,
      }),
    });
    const newItem = await response.json();
    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemDueDate("");
  };

  const toggleItemCompletion = async (id: string, completed: boolean) => {
    const response = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    const updatedItem = await response.json();
    setItems(items.map((item) => (item.id === id ? updatedItem : item)));
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (response.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        const data = await response.json();
        alert(`Failed to delete item: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const selectedClass = Array.isArray(classes)
    ? classes.find((c) => c.id === selectedClassId)
    : null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">Assignment Tracker</h1>

        {/* Classes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter class name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createClass()}
              />
              <Button onClick={createClass}>Add Class</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {classes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No classes yet. Create one above!
                </p>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition-colors ${
                      selectedClassId === cls.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    }`}
                    onClick={() => setSelectedClassId(cls.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClass(cls.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedClass.name} - Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center flex-wrap">
                <div>
                  <label className="text-sm font-medium mr-2">Tag:</label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="rounded-md border border-input px-3 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="assignment">Assignment</option>
                    <option value="midterm">Midterm</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mr-2">Status:</label>
                  <select
                    value={filterCompleted}
                    onChange={(e) => setFilterCompleted(e.target.value)}
                    className="rounded-md border border-input px-3 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="true">Completed</option>
                    <option value="false">Not Completed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Due Date:</label>
                  <div className="flex items-center gap-1">
                    <DatePicker
                      value={filterDueDate}
                      onChange={(value) => setFilterDueDate(value)}
                      placeholder="Filter by date"
                      className="h-9 w-[200px]"
                    />
                    {filterDueDate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFilterDueDate("")}
                        className="h-9 w-9"
                        title="Clear date filter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Item Form */}
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">
                    Name:
                  </label>
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tag:</label>
                  <select
                    value={newItemTag}
                    onChange={(e) =>
                      setNewItemTag(e.target.value as "assignment" | "midterm")
                    }
                    className="rounded-md border border-input px-3 py-1 text-sm h-9 w-full"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="midterm">Midterm</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Due Date:
                  </label>
                  <DatePicker
                    value={newItemDueDate}
                    onChange={(value) => setNewItemDueDate(value)}
                    placeholder="Pick a due date"
                    className="h-9"
                  />
                </div>
                <Button onClick={addItem}>Add Item</Button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No items found
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-md hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={item.completed}
                        onChange={() =>
                          toggleItemCompletion(item.id, item.completed)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              item.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.tag === "midterm"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
