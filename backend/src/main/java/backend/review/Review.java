package backend.review;

import backend.listing.ServiceListing;
import backend.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;
    private String comment;

    @ManyToOne
    private User student;

    @ManyToOne
    private ServiceListing provider;

    // getters and setters
    public void setStudent(User student) {
    this.student = student;
}

public void setProvider(ServiceListing provider) {
    this.provider = provider;
}

public void setRating(int rating) {
    this.rating = rating;
}

public void setComment(String comment) {
    this.comment = comment;
}
}