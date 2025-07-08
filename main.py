from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd
from datetime import datetime
# Import our modules
from database import engine, get_db, SessionLocal
from models import Base, Product, FeedbackEntry

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize sample data
def init_sample_data():
    db = SessionLocal()
    try:
        # Check if products already exist
        if db.query(Product).count() == 0:
            sample_products = [
                Product(
                    product_id="PRD001",
                    name="Wireless Bluetooth Headphones"
                ),
                Product(
                    product_id="PRD002",
                    name="Smart Fitness Watch"
                ),
                Product(
                    product_id="PRD003",
                    name="Portable Laptop Stand"
                ),
                Product(
                    product_id="PRD004",
                    name="Wireless Charging Pad"
                ),
                Product(
                    product_id="PRD005",
                    name="Premium Coffee Beans"
                ),
                Product(
                    product_id="PRD006",
                    name="Smart Home Security Camera"
                )
            ]

            for product in sample_products:
                db.add(product)
            db.commit()
            print("Sample products added to database")
    finally:
        db.close()

# Initialize sample data on startup
init_sample_data()

# FastAPI app
app = FastAPI(title="Customer Feedback API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


# Pydantic schemas 
class FeedbackCreate(BaseModel):
    product_id: str
    score: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    product_id: str
    score: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProductAverage(BaseModel):
    product_id: str
    average_score: float
    feedback_count: int


class ProductResponse(BaseModel):
    id: int
    product_id: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


# Routes
@app.get("/")
def home():
    from fastapi.responses import FileResponse
    return FileResponse('static/index.html')


@app.get("/products/", response_model=List[ProductResponse])
def get_all_products(db: Session = Depends(get_db)):
    """Get all products"""
    products = db.query(Product).all()
    return products


@app.post("/feedback/", response_model=FeedbackResponse)
def create_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    """Create new feedback entry"""

    # Create product if doesn't exist
    product = db.query(Product).filter(
        Product.product_id == feedback.product_id).first()
    if not product:
        product = Product(product_id=feedback.product_id,
                          name=f"Product {feedback.product_id}")
        db.add(product)
        db.commit()

    # Create feedback
    db_feedback = FeedbackEntry(product_id=feedback.product_id,
                                score=feedback.score,
                                comment=feedback.comment)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)

    return db_feedback


@app.get("/feedback/", response_model=List[FeedbackResponse])
def get_all_feedback(db: Session = Depends(get_db)):
    """Get all feedback entries"""
    feedback = db.query(FeedbackEntry).all()
    return feedback


@app.get("/feedback/averages/", response_model=List[ProductAverage])
def get_product_averages(db: Session = Depends(get_db)):
    """Get average scores for all products"""

    results = db.query(FeedbackEntry.product_id,
                       func.avg(FeedbackEntry.score).label('average_score'),
                       func.count(
                           FeedbackEntry.id).label('feedback_count')).group_by(
                               FeedbackEntry.product_id).all()

    return [
        ProductAverage(product_id=result.product_id,
                       average_score=round(float(result.average_score), 2),
                       feedback_count=result.feedback_count)
        for result in results
    ]


@app.get("/feedback/product/{product_id}",
         response_model=List[FeedbackResponse])
def get_feedback_by_product(product_id: str, db: Session = Depends(get_db)):
    """Get feedback for specific product"""
    feedback = db.query(FeedbackEntry).filter(
        FeedbackEntry.product_id == product_id).all()
    if not feedback:
        raise HTTPException(status_code=404,
                            detail="No feedback found for this product")
    return feedback


@app.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, product_id: str = Query(...), db: Session = Depends(get_db)):
    """Delete feedback entry by ID and product ID"""
    # Find the feedback entry
    feedback = db.query(FeedbackEntry).filter(FeedbackEntry.id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    # Verify that the product_id matches
    if feedback.product_id != product_id:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Delete the feedback
    db.delete(feedback)
    db.commit()

    return {"message": "Feedback deleted successfully"}


# Run the app
if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))  # Replit assigns a dynamic port
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)