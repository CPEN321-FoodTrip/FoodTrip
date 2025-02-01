# M3 - Requirements and Design

## 1. Change History
<!-- Leave blank for M3 -->

## 2. Project Description


## 3. Requirements Specification
### **3.1. Use-Case Diagram**
![Use-Case Diagram](images/use-case-diagram.png)


### **3.2. Actors Description**
1. **Application User**: An actor who interacts with the app to create food trips, manage grocery lists, and share their journey on social media. Users can set dietary preferences and explore different cuisines.
2. **Grocery Store**: An actor that can provide information about item availability, offer discounts, and notify users of out-of-stock ingredients.


### **3.3. Functional Requirements**
<a name="fr1"></a>

1. **Manage food trip** 
    - **Overview**:
        1. Select a starting country and an ending country.
        2. Set the number of locations to explore.
        3. Set dietary preferences and restrictions.
        4. Generate a travel route with associated recipes.
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Creating a food trip**:
            - **Description**: The user inputs a start and end country, along with preferences.
            - **Primary actor(s)**: App user.
            - **Main success scenario**:
                1. User selects starting and ending countries.
                2. User sets the number of location and dietary preferences.
                3. The app generates a realistic route with recipes from each country.
                4. The trip is displayed on a map with recipe pins.
            - **Failure scenario(s)**:
                - 1a. No valid route exists.
                    - 1a1. Notify user and suggest other options.
                - 1b. No recipes match the dietary restrictions.
                    - 1b1. Ask user to relax restrictions or modify selection.
    
2. **Manage Grocery List** 
    - **Overview**:
        1. Generate a list of required ingredients for the trip.
        2. Optimize for ingredient reuse to reduce costs.
        3. Display available discounts from partner grocery stores.
        4. Let users know about out-of-stock items and offer other options.
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Generating a Grocery List**:
            - **Description**: The app creates a shopping list based on recipes.
            - **Primary actor(s)**: App user and grocery store.
            - **Main success scenario**:
                1. The app finds required ingredients from selected recipes.
                2. It checks for reusable ingredients across multiple recipes.
                3. The grocery list is created and shown to the user.
            - **Failure scenario(s)**:
                - 1a. Some ingredients are not available.
                    - 1a1. Let user know and suggest replacement options.

3. **Share on Social Media** 
    - **Overview**:
        1. Users can share their food trip and recipes.
        2. View other users' trips.
    
    - **Detailed Flow for Each Independent Scenario**: 
        1. **Sharing a Trip**:
            - **Description**: Users post their completed food trips on social media.
            - **Primary actor(s)**: App user. 
            - **Main success scenario**:
                1. User selects a completed trip.
                2. The app generates a post with trip details and photos.
                3. User shares on selected platforms (Facebook, Instagram, etc.).
            - **Failure scenario(s)**:
                - 1a. No internet connection.
                    - 1a1. Let user know and allow retry later.


### **3.4. Screen Mockups**
Not necessary to explain our requirements.


### **3.5. Non-Functional Requirements**
<a name="nfr1"></a>

1. **Efficient performance**
    - **Description**: The system should generate food trips and grocery lists in under 10 seconds.
    - **Justification**: Helps to ensure a good user experience without long loading times.
2. **Security and privacy**
    - **Description**: User data such as dietary preferences and grocery lists should be securely stored and only accessible from an authenticated account.
    - **Justification**: Helps build user trust and ensures data protection.


## 4. Designs Specification
### **4.1. Main Components**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
2. ...


### **4.2. Databases**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
2. ...


### **4.3. External Modules**
1. **[WRITE_NAME_HERE]** 
    - **Purpose**: ...
2. ...


### **4.4. Frameworks**
1. **AWS**
    - **Purpose**: EC2 Instance
    - **Reason**: ...
2. ...


### **4.5. Dependencies Diagram**


### **4.6. Functional Requirements Sequence Diagram**
1. [**[WRITE_NAME_HERE]**](#fr1)\
[SEQUENCE_DIAGRAM_HERE]
2. ...


### **4.7. Non-Functional Requirements Design**
1. [**[WRITE_NAME_HERE]**](#nfr1)
    - **Validation**: ...
2. ...


### **4.8. Main Project Complexity Design**
**[WRITE_NAME_HERE]**
- **Description**: ...
- **Why complex?**: ...
- **Design**:
    - **Input**: ...
    - **Output**: ...
    - **Main computational logic**: ...
    - **Pseudo-code**: ...
        ```
        
        ```


## 5. Contributions
- ...
- ...
- ...
- ...
