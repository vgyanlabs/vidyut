# Knowledge Graph Backend Architecture for StudyPro

## System Architecture Overview

The backend architecture for StudyPro's knowledge graph feature is designed as a modular, scalable system that processes student data, generates and maintains knowledge graphs, and provides APIs for frontend interaction. The architecture follows a microservices approach to ensure flexibility and maintainability.

```
┌─────────────────────────────────────────────────────────────────┐
│                      StudyPro Application                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                   Knowledge Graph Service Layer                  │
└───────┬───────────────┬────────────────┬────────────┬───────────┘
        │               │                │            │
┌───────▼───────┐ ┌─────▼──────┐ ┌───────▼─────┐ ┌────▼─────────┐
│  Data Ingestion│ │ Graph Engine│ │ LLM Processor│ │ API Gateway  │
│    Service    │ │   Service   │ │   Service    │ │   Service    │
└───────┬───────┘ └─────┬──────┘ └───────┬─────┘ └────┬─────────┘
        │               │                │            │
┌───────▼───────────────▼────────────────▼────────────▼───────────┐
│                        Data Storage Layer                        │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Data Storage Layer

#### Graph Database
- **Technology**: Neo4j or Amazon Neptune
- **Purpose**: Store the knowledge graph structure (nodes and edges)
- **Schema**:
  ```
  Node {
    id: UUID,
    type: String,           // "concept", "topic", "subtopic"
    label: String,          // Human-readable name
    description: String,    // Detailed explanation
    difficulty: Float,      // 0.0-1.0 scale
    importance: Float,      // 0.0-1.0 scale
    metadata: JSON          // Additional properties
  }
  
  Edge {
    id: UUID,
    source_id: UUID,        // Source node ID
    target_id: UUID,        // Target node ID
    type: String,           // "prerequisite", "related", "part_of"
    weight: Float,          // Strength of relationship (0.0-1.0)
    metadata: JSON          // Additional properties
  }
  ```

#### Document Database
- **Technology**: MongoDB
- **Purpose**: Store student-specific data and proficiency metrics
- **Collections**:
  - `student_profiles`: Basic student information
  - `proficiency_metrics`: Student performance on specific concepts
  - `study_sessions`: Records of LLM study interactions
  - `quiz_results`: Detailed quiz performance data

#### Vector Database
- **Technology**: Pinecone or Milvus
- **Purpose**: Store concept embeddings for semantic similarity search
- **Schema**:
  ```
  ConceptVector {
    id: UUID,               // Matches concept node ID
    embedding: Vector,      // High-dimensional vector representation
    metadata: JSON          // Additional properties for filtering
  }
  ```

### 2. Data Ingestion Service

- **Purpose**: Collect and process data from various sources
- **Components**:
  - **Quiz Analyzer**: Processes quiz results to extract concept proficiency
  - **Session Parser**: Analyzes study sessions with LLM to identify concepts
  - **Activity Tracker**: Monitors student engagement with materials
  - **Event Queue**: Kafka or RabbitMQ for event-driven processing

- **Processing Pipeline**:
  ```
  1. Raw data collection from StudyPro application
  2. Data normalization and validation
  3. Event generation and publication
  4. Batch processing for historical analysis
  ```

### 3. Graph Engine Service

- **Purpose**: Manage knowledge graph creation, updates, and queries
- **Components**:
  - **Graph Generator**: Creates initial knowledge graph from curriculum
  - **Graph Updater**: Incrementally updates graph based on new data
  - **Gap Detector**: Identifies knowledge gaps using graph algorithms
  - **Path Finder**: Discovers optimal learning paths through the graph

- **Key Algorithms**:
  - **Proficiency Calculation**:
    ```python
    def calculate_proficiency(concept_id, student_id):
        quiz_scores = get_quiz_scores(concept_id, student_id)
        session_engagement = get_session_engagement(concept_id, student_id)
        time_spent = get_time_spent(concept_id, student_id)
        
        # Weighted formula for proficiency
        proficiency = (0.6 * quiz_scores) + (0.3 * session_engagement) + (0.1 * time_spent)
        
        # Apply decay factor for time since last engagement
        time_factor = calculate_time_decay(concept_id, student_id)
        proficiency = proficiency * time_factor
        
        return proficiency
    ```
  
  - **Gap Identification**:
    ```python
    def identify_gaps(student_id):
        knowledge_graph = get_student_graph(student_id)
        gaps = []
        
        for concept in knowledge_graph.nodes:
            proficiency = get_proficiency(concept.id, student_id)
            prerequisites = get_prerequisites(concept.id)
            
            # Check if proficiency is below threshold
            if proficiency < PROFICIENCY_THRESHOLD:
                gaps.append(concept)
                continue
                
            # Check if prerequisites have sufficient proficiency
            for prereq in prerequisites:
                prereq_proficiency = get_proficiency(prereq.id, student_id)
                if prereq_proficiency < PREREQUISITE_THRESHOLD:
                    gaps.append(prereq)
        
        return gaps
    ```

### 4. LLM Processor Service

- **Purpose**: Interface with LLM for knowledge extraction and personalization
- **Components**:
  - **Concept Extractor**: Uses LLM to identify key concepts from materials
  - **Relationship Generator**: Determines connections between concepts
  - **Explanation Creator**: Generates natural language explanations
  - **Recommendation Engine**: Suggests personalized study paths

- **LLM Integration**:
  ```python
  def extract_concepts_from_session(session_transcript):
      prompt = f"""
      Analyze the following study session transcript and extract key computer science concepts discussed:
      
      {session_transcript}
      
      Return a JSON array of concepts with the following structure:
      [
          {
              "concept": "concept name",
              "importance": 0.0-1.0,
              "mastery_level": 0.0-1.0,
              "related_concepts": ["concept1", "concept2"]
          }
      ]
      """
      
      response = llm_client.generate(prompt)
      concepts = parse_json(response)
      
      return concepts
  ```

### 5. API Gateway Service

- **Purpose**: Provide unified interface for frontend and external systems
- **Endpoints**:
  - **Knowledge Graph Retrieval**:
    - `GET /api/v1/knowledge-graph/{student_id}`
    - `GET /api/v1/knowledge-graph/{student_id}/topic/{topic_id}`
  
  - **Gap Analysis**:
    - `GET /api/v1/gaps/{student_id}`
    - `GET /api/v1/recommendations/{student_id}`
  
  - **Student Interaction**:
    - `POST /api/v1/knowledge-graph/node` (Create custom node)
    - `PUT /api/v1/knowledge-graph/node/{node_id}` (Update node)
    - `POST /api/v1/knowledge-graph/edge` (Create custom edge)
  
  - **Analytics**:
    - `GET /api/v1/analytics/progress/{student_id}`
    - `GET /api/v1/analytics/engagement/{student_id}`

- **Authentication & Authorization**:
  - JWT-based authentication
  - Role-based access control (student, instructor, admin)
  - Rate limiting to prevent abuse

## Data Flow Processes

### 1. Knowledge Graph Initialization

```
1. Curriculum structure is processed by Graph Generator
2. LLM Processor extracts key concepts and relationships
3. Initial graph structure is stored in Graph Database
4. Default proficiency values are set for new students
```

### 2. Continuous Graph Updates

```
1. Student completes quiz or study session
2. Data Ingestion Service processes the new data
3. Event is published to update queue
4. Graph Engine Service updates relevant nodes and edges
5. Gap Detector identifies new or resolved knowledge gaps
6. Updated graph is available via API
```

### 3. Knowledge Gap Identification Process

```
1. Student proficiency data is analyzed across all concepts
2. Graph algorithms identify concepts below threshold proficiency
3. Prerequisite relationships are analyzed to find dependency gaps
4. Time-based decay is applied to concepts not recently reinforced
5. Non-clickable status is applied to gap nodes in the frontend
```

## Scalability and Performance Considerations

### Horizontal Scaling
- Stateless services deployed in containers (Docker)
- Orchestration with Kubernetes for auto-scaling
- Sharding of graph database for large-scale deployments

### Caching Strategy
- Redis cache for frequently accessed graph segments
- Pre-computed gap analysis for active students
- Materialized views for common graph traversals

### Batch Processing
- Daily recalculation of global graph statistics
- Weekly comprehensive gap analysis
- Monthly curriculum alignment checks

## Monitoring and Maintenance

### Telemetry
- Prometheus metrics for service performance
- Grafana dashboards for visualization
- Custom alerts for critical service degradation

### Data Integrity
- Regular graph consistency checks
- Automated tests for graph algorithms
- Validation of LLM-generated content

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud Infrastructure                        │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │ Application │   │  Database   │   │ Background Workers  │   │
│  │  Cluster    │   │  Cluster    │   │     Cluster         │   │
│  └─────────────┘   └─────────────┘   └─────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────┐   ┌─────────────────────────────┐ │
│  │     Cache Cluster       │   │      Message Queue          │ │
│  └─────────────────────────┘   └─────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This architecture provides a robust foundation for implementing the knowledge graph feature in StudyPro, with particular emphasis on automatically identifying knowledge gaps and representing them as non-clickable nodes in the student interface.
